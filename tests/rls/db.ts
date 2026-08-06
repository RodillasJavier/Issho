/**
 * tests/rls/db.ts
 *
 * Bootstraps a scratch database from `supabase/migrations/` plus the auth
 * harness, and gives tests a way to run SQL *as* a particular user.
 *
 * Impersonation mirrors what PostgREST does per request: set the role, and
 * put the user's id in the `request.jwt.claims` GUC that `auth.uid()` reads.
 * Everything runs inside a transaction that is rolled back afterwards, so
 * tests never see each other's writes and order doesn't matter.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const ROOT = join(import.meta.dirname, "../..");
const MIGRATIONS = join(ROOT, "supabase/migrations");
const HARNESS = join(ROOT, "supabase/tests/harness.sql");

/** Falls back to the container the README tells you to start. */
export const ADMIN_URL =
  process.env.RLS_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:55432/postgres";

const dbUrlFor = (database: string) =>
  ADMIN_URL.replace(/\/[^/]*$/, `/${database}`);

const connect = async (url: string) => {
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
};

/**
 * Create a scratch database and apply the harness, then every migration in
 * filename order — the same order Supabase applies them, so a migration that
 * only works because of local state fails here.
 */
export const createTestDatabase = async (name: string): Promise<string> => {
  const admin = await connect(ADMIN_URL);
  try {
    await admin.query(`drop database if exists ${name} with (force)`);
    await admin.query(`create database ${name}`);
  } finally {
    await admin.end();
  }

  const url = dbUrlFor(name);
  const db = await connect(url);
  try {
    await db.query(readFileSync(HARNESS, "utf8"));

    const files = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    if (files.length === 0) {
      throw new Error(`no migrations found in ${MIGRATIONS}`);
    }
    for (const file of files) {
      await db.query(readFileSync(join(MIGRATIONS, file), "utf8"));
    }
  } finally {
    await db.end();
  }

  return url;
};

export const dropTestDatabase = async (name: string) => {
  const admin = await connect(ADMIN_URL);
  try {
    await admin.query(`drop database if exists ${name} with (force)`);
  } finally {
    await admin.end();
  }
};

export type Actor = { id: string } | "anon";

/**
 * A connection that runs statements as a given actor.
 *
 * `service_role` bypasses RLS and is how fixtures are written — the same
 * split Supabase has between the anon key and the service key.
 */
export class TestDb {
  // Written out rather than a constructor parameter property, which
  // `erasableSyntaxOnly` disallows.
  private readonly client: Client;

  private constructor(client: Client) {
    this.client = client;
  }

  static async open(url: string) {
    return new TestDb(await connect(url));
  }

  async close() {
    await this.client.end();
  }

  /** Insert fixtures with RLS out of the way. */
  async asService<T = unknown>(sql: string, params: unknown[] = []) {
    const result = await this.client.query<T & Record<string, unknown>>(
      sql,
      params as never[]
    );
    return result.rows;
  }

  /**
   * Run SQL as `actor`, inside a rolled-back transaction.
   *
   * `set local` scopes the role and claims to the transaction, so the
   * connection is clean again afterwards even when the body throws.
   */
  async as<T = unknown>(
    actor: Actor,
    sql: string,
    params: unknown[] = []
  ): Promise<(T & Record<string, unknown>)[]> {
    await this.client.query("begin");
    try {
      if (actor === "anon") {
        await this.client.query("set local role anon");
        await this.client.query(`set local request.jwt.claims = '{}'`);
      } else {
        await this.client.query("set local role authenticated");
        await this.client.query("select set_config($1, $2, true)", [
          "request.jwt.claims",
          JSON.stringify({ sub: actor.id, role: "authenticated" }),
        ]);
      }
      const result = await this.client.query<T & Record<string, unknown>>(
        sql,
        params as never[]
      );
      return result.rows;
    } finally {
      await this.client.query("rollback");
    }
  }

  /** Assert that a statement is rejected, returning the Postgres error. */
  async expectRejected(
    actor: Actor,
    sql: string,
    params: unknown[] = []
  ): Promise<{ code?: string; message: string }> {
    try {
      await this.as(actor, sql, params);
    } catch (error) {
      const e = error as { code?: string; message: string };
      return { code: e.code, message: e.message };
    }
    throw new Error(
      `expected the statement to be rejected, but it succeeded:\n${sql}`
    );
  }
}

/** Create an auth user; the on_auth_user_created trigger adds the profile. */
export const createUser = async (db: TestDb, username: string) => {
  const [row] = await db.asService<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [`${username}@example.test`]
  );
  await db.asService(`update public.profiles set username = $2 where id = $1`, [
    row.id,
    username,
  ]);
  return row.id;
};
