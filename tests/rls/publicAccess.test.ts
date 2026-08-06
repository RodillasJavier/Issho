/**
 * tests/rls/publicAccess.test.ts
 *
 * What a logged-out visitor can reach. Two things are asserted here that look
 * contradictory and aren't: the de-identified feed RPCs must stay open to
 * anon, and `franchises` must stay readable by anon — while every table
 * holding user content must stay shut.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestDb, createTestDatabase, createUser, dropTestDatabase } from "./db";

const DB_NAME = "issho_rls_public";

let db: TestDb;
let author: string;
let entryId: string;

beforeAll(async () => {
  const url = await createTestDatabase(DB_NAME);
  db = await TestDb.open(url);

  author = await createUser(db, "author");

  await db.asService(
    `insert into anime (name, description, cover_image_url, anilist_id, franchise_key, franchise_title, format, year)
     values ('Season One', 'desc', 'cover.jpg', 1, 1, 'Root Title', 'TV', 2013),
            ('Root OVA', 'desc', 'ova.jpg', 2, 1, 'Root Title', 'OVA', 2012)`
  );

  const [anime] = await db.asService<{ id: string }>(
    `select id from anime where anilist_id = 1`
  );
  [{ id: entryId }] = await db.asService<{ id: string }>(
    `insert into entries (anime_id, entry_type, user_id, content)
     values ($1, 'review', $2, 'a review') returning id`,
    [anime.id, author]
  );
  await db.asService(
    `insert into votes (entry_id, user_id, vote) values ($1, $2, 1)`,
    [entryId, author]
  );
  await db.asService(
    `insert into comments (entry_id, user_id, content) values ($1, $2, 'hi')`,
    [entryId, author]
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
  await dropTestDatabase(DB_NAME);
});

describe("get_public_feed", () => {
  it("is callable by anon", async () => {
    const rows = await db.as("anon", `select id from get_public_feed()`);
    expect(rows).toHaveLength(1);
  });

  it("is NOT callable by a signed-in user", async () => {
    // Otherwise a member could read the entire site de-identified, bypassing
    // the friend gate entirely.
    const error = await db.expectRejected(
      { id: author },
      `select id from get_public_feed()`
    );
    expect(error.code).toBe("42501");
  });

  it("omits user_id from its return type entirely", async () => {
    // Anonymity is a property of the data, not a flag the UI could forget —
    // there is no author column to accidentally select.
    const [row] = await db.asService<{ result: string }>(
      `select pg_get_function_result(oid) as result
       from pg_proc where proname = 'get_public_feed'`
    );

    expect(row.result).toContain("content");
    expect(row.result).not.toContain("user_id");
  });

  it("cannot be made to yield an author by selecting one", async () => {
    const error = await db.expectRejected(
      "anon",
      `select user_id from get_public_feed()`
    );
    expect(error.code).toBe("42703"); // undefined_column
  });

  it("clamps the limit rather than trusting the caller", async () => {
    // `limit least(greatest(limit_count, 1), 200)`. Asserting on exact counts
    // needs more rows than the ceiling, otherwise every expectation passes on
    // an empty-ish table and the test holds whether or not the clamp exists.
    const [anime] = await db.asService<{ id: string }>(
      `select id from anime where anilist_id = 1`
    );
    await db.asService(
      `insert into entries (anime_id, entry_type, user_id, content)
       select $1, 'review', $2, 'bulk ' || g from generate_series(1, 220) g`,
      [anime.id, author]
    );

    try {
      const count = async (limit: number) =>
        (await db.as("anon", `select id from get_public_feed($1)`, [limit]))
          .length;

      expect(await count(10_000)).toBe(200); // ceiling
      expect(await count(-5)).toBe(1); // floor, not "everything"
      expect(await count(0)).toBe(1);
      expect(await count(5)).toBe(5); // a sane value is still honoured
    } finally {
      // The later assertions read the newest row and count on this file's
      // handful of fixtures, so the bulk rows must not outlive this test.
      await db.asService(`delete from entries where content like 'bulk %'`);
    }
  });

  it("still aggregates vote and comment counts", async () => {
    const [row] = await db.as<{ likes_count: string; comment_count: string }>(
      "anon",
      `select likes_count, comment_count from get_public_feed()`
    );
    expect(Number(row.likes_count)).toBe(1);
    expect(Number(row.comment_count)).toBe(1);
  });
});

describe("get_public_entry", () => {
  it("is callable by anon and not by a member", async () => {
    expect(
      await db.as("anon", `select id from get_public_entry($1)`, [entryId])
    ).toHaveLength(1);

    const error = await db.expectRejected(
      { id: author },
      `select id from get_public_entry($1)`,
      [entryId]
    );
    expect(error.code).toBe("42501");
  });
});

describe("anon has no direct read on user content", () => {
  it.each([
    "entries",
    "user_anime_entries",
    "user_franchise_entries",
    "comments",
    "votes",
  ])("returns nothing from %s", async (table) => {
    expect(await db.as("anon", `select * from ${table}`)).toHaveLength(0);
  });

  it("cannot call the visibility helpers", async () => {
    // anon has no business probing the friendship graph.
    const error = await db.expectRejected("anon", `select can_view_user($1)`, [
      author,
    ]);
    expect(error.code).toBe("42501");
  });
});

describe("franchises view", () => {
  // A deliberate exception to friend-gating: no user content, only public
  // anime metadata, and the logged-out experience depends on it. Do not
  // "harden" this with a can_view_user policy.
  it("is readable by anon and by members", async () => {
    expect(
      await db.as("anon", `select anilist_root_id from franchises`)
    ).toHaveLength(1);
    expect(
      await db.as({ id: author }, `select anilist_root_id from franchises`)
    ).toHaveLength(1);
  });

  it("headlines the earliest TV member, not the chain root", async () => {
    const [row] = await db.as<{ title: string; display_title: string }>(
      "anon",
      `select title, display_title from franchises`
    );
    expect(row.title).toBe("Root Title");
    expect(row.display_title).toBe("Season One");
  });

  it("grants only SELECT, to both roles", async () => {
    // Asserted on the privilege rather than by attempting a write: the GROUP BY
    // makes this view non-auto-updatable, so an INSERT fails with 55000
    // (object_not_in_prerequisite_state) before privileges are even consulted.
    // That is a Postgres implementation detail which would evaporate if the
    // view were ever simplified — and writes would then propagate into `anime`,
    // which every authenticated user can already UPDATE. The revoke is the
    // thing actually protecting it, so the revoke is what gets tested.
    const rows = await db.asService<{
      grantee: string;
      privilege_type: string;
    }>(
      `select grantee, privilege_type from information_schema.role_table_grants
       where table_name = 'franchises' and grantee in ('anon', 'authenticated')
       order by grantee, privilege_type`
    );

    expect(rows).toEqual([
      { grantee: "anon", privilege_type: "SELECT" },
      { grantee: "authenticated", privilege_type: "SELECT" },
    ]);
  });

  it("inherits anime's RLS rather than running as its owner", async () => {
    const [row] = await db.asService<{ reloptions: string[] | null }>(
      `select reloptions from pg_class where relname = 'franchises'`
    );
    expect(row.reloptions ?? []).toContain("security_invoker=true");
  });
});
