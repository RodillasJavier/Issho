/**
 * tests/rls/avatarStorage.test.ts
 *
 * Avatar uploads are scoped to a folder named for the uploader's uid. That is
 * the only thing standing between an authenticated user and overwriting someone
 * else's avatar, and until 20260805172434 it existed solely in production —
 * a database built from this repo had no bucket and no storage RLS at all.
 *
 * The storage schema here is the harness's trimmed stand-in, not real Supabase
 * Storage, so this covers the policy predicates and nothing else — the API
 * layer's own checks are out of scope.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestDb, createTestDatabase, createUser, dropTestDatabase } from "./db";

const DB_NAME = "issho_rls_avatars";

let db: TestDb;
let owner: string;
let attacker: string;

beforeAll(async () => {
  const url = await createTestDatabase(DB_NAME);
  db = await TestDb.open(url);

  owner = await createUser(db, "owner");
  attacker = await createUser(db, "attacker");
}, 60_000);

afterAll(async () => {
  await db?.close();
  await dropTestDatabase(DB_NAME);
});

describe("the avatars bucket", () => {
  it("exists, so a database built from source can store avatars", async () => {
    const [bucket] = await db.asService<{
      public: boolean;
      file_size_limit: string;
      allowed_mime_types: string[];
    }>(
      `select public, file_size_limit, allowed_mime_types
         from storage.buckets where id = 'avatars'`
    );

    expect(bucket).toBeDefined();
    expect(bucket.public).toBe(true);
    // Enforced on the bucket, not just in AvatarField — client-side validation
    // is advisory. The mime list mirrors AVATAR_MIME_EXTENSIONS.
    expect(Number(bucket.file_size_limit)).toBe(5_242_880);
    expect(bucket.allowed_mime_types).toContain("image/png");
    expect(bucket.allowed_mime_types).not.toContain("image/svg+xml");
  });
});

describe("avatar write scoping", () => {
  it("lets a user write into their own folder", async () => {
    const rows = await db.as(
      { id: owner },
      `insert into storage.objects (bucket_id, name)
       values ('avatars', $1) returning id`,
      [`${owner}/avatar.png`]
    );
    expect(rows).toHaveLength(1);
  });

  it("refuses a write into someone else's folder", async () => {
    // The whole point of the folder convention: without this an authenticated
    // user could overwrite any avatar on the site.
    const error = await db.expectRejected(
      { id: attacker },
      `insert into storage.objects (bucket_id, name) values ('avatars', $1)`,
      [`${owner}/avatar.png`]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses a write into a bucket with no policy", async () => {
    await db.asService(
      `insert into storage.buckets (id, name) values ('private', 'private')
       on conflict (id) do nothing`
    );
    const error = await db.expectRejected(
      { id: owner },
      `insert into storage.objects (bucket_id, name) values ('private', $1)`,
      [`${owner}/secret.png`]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses to rename an owned object into another user's folder", async () => {
    // The USING clause passes here — the attacker does own the row — so this
    // is entirely the WITH CHECK's job. An UPDATE policy with only a USING
    // clause would let this through, which is what 20260802185750 fixed.
    await db.asService(
      `insert into storage.objects (bucket_id, name) values ('avatars', $1)`,
      [`${attacker}/avatar.png`]
    );

    const error = await db.expectRejected(
      { id: attacker },
      `update storage.objects set name = $1 where name = $2`,
      [`${owner}/avatar.png`, `${attacker}/avatar.png`]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses to delete another user's avatar", async () => {
    await db.asService(
      `insert into storage.objects (bucket_id, name) values ('avatars', $1)
       on conflict do nothing`,
      [`${owner}/avatar.png`]
    );

    const deleted = await db.as(
      { id: attacker },
      `delete from storage.objects where name = $1 returning id`,
      [`${owner}/avatar.png`]
    );
    // A DELETE filtered out by RLS removes nothing rather than raising.
    expect(deleted).toHaveLength(0);
  });
});

describe("avatar reads", () => {
  it("are open to anon, since avatars render on logged-out pages", async () => {
    await db.asService(
      `insert into storage.objects (bucket_id, name) values ('avatars', $1)
       on conflict do nothing`,
      [`${owner}/avatar.png`]
    );

    const rows = await db.as(
      "anon",
      `select id from storage.objects where bucket_id = 'avatars'`
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it("do not extend to other buckets", async () => {
    await db.asService(
      `insert into storage.buckets (id, name) values ('private', 'private')
       on conflict (id) do nothing`
    );
    await db.asService(
      `insert into storage.objects (bucket_id, name) values ('private', 'x.png')`
    );

    const rows = await db.as(
      "anon",
      `select id from storage.objects where bucket_id = 'private'`
    );
    expect(rows).toHaveLength(0);
  });
});
