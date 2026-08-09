/**
 * tests/rls/visibility.test.ts
 *
 * Issho's privacy model in one sentence: you see your own activity and your
 * accepted friends', nothing else. It is enforced in Postgres, not the UI, so
 * this is the file that actually checks it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestDb, createTestDatabase, createUser, dropTestDatabase } from "./db";

const DB_NAME = "issho_rls_visibility";

let db: TestDb;
let alice: string;
let bob: string;
let stranger: string;
let animeId: string;
let aliceEntry: string;
let strangerEntry: string;

beforeAll(async () => {
  const url = await createTestDatabase(DB_NAME);
  db = await TestDb.open(url);

  alice = await createUser(db, "alice");
  bob = await createUser(db, "bob");
  stranger = await createUser(db, "stranger");

  [{ id: animeId }] = await db.asService<{ id: string }>(
    `insert into anime (name, description, cover_image_url, anilist_id, franchise_key)
     values ('Test Show', 'desc', 'cover.jpg', 1, 1) returning id`
  );

  [{ id: aliceEntry }] = await db.asService<{ id: string }>(
    `insert into entries (anime_id, entry_type, user_id, content)
     values ($1, 'review', $2, 'alice review') returning id`,
    [animeId, alice]
  );
  [{ id: strangerEntry }] = await db.asService<{ id: string }>(
    `insert into entries (anime_id, entry_type, user_id, content)
     values ($1, 'review', $2, 'stranger review') returning id`,
    [animeId, stranger]
  );

  await db.asService(
    `insert into user_anime_entries (user_id, anime_id, status) values ($1, $2, 'watching')`,
    [stranger, animeId]
  );
  await db.asService(
    `insert into user_franchise_entries (user_id, franchise_key, status)
     values ($1, $2, 'watching')`,
    [stranger, 1]
  );
  await db.asService(
    `insert into comments (entry_id, user_id, content) values ($1, $2, 'nice')`,
    [strangerEntry, stranger]
  );
  await db.asService(
    `insert into votes (entry_id, user_id, vote) values ($1, $2, 1)`,
    [strangerEntry, stranger]
  );

  // Alice and Bob are friends; the stranger is friends with nobody.
  await db.asService(
    `insert into friendships (requester_id, addressee_id, status)
     values ($1, $2, 'accepted')`,
    [alice, bob]
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
  await dropTestDatabase(DB_NAME);
});

describe("entries", () => {
  it("shows a user their own entries", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from entries where id = $1`,
      [aliceEntry]
    );
    expect(rows).toHaveLength(1);
  });

  it("shows a user their friend's entries", async () => {
    const rows = await db.as(
      { id: bob },
      `select id from entries where id = $1`,
      [aliceEntry]
    );
    expect(rows).toHaveLength(1);
  });

  it("hides a non-friend's entries", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from entries where id = $1`,
      [strangerEntry]
    );
    expect(rows).toHaveLength(0);
  });

  it("returns nothing at all to an anonymous reader", async () => {
    const rows = await db.as("anon", `select id from entries`);
    expect(rows).toHaveLength(0);
  });

  it("flips visibility the moment a friendship is accepted", async () => {
    // The whole product promise, in one assertion.
    const before = await db.as(
      { id: alice },
      `select id from entries where user_id = $1`,
      [stranger]
    );
    expect(before).toHaveLength(0);

    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'accepted')`,
      [alice, stranger]
    );
    try {
      const after = await db.as(
        { id: alice },
        `select id from entries where user_id = $1`,
        [stranger]
      );
      expect(after).toHaveLength(1);
    } finally {
      await db.asService(
        `delete from friendships where requester_id = $1 and addressee_id = $2`,
        [alice, stranger]
      );
    }
  });

  it("does not treat a pending request as friendship", async () => {
    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [alice, stranger]
    );
    try {
      const rows = await db.as(
        { id: alice },
        `select id from entries where user_id = $1`,
        [stranger]
      );
      expect(rows).toHaveLength(0);
    } finally {
      await db.asService(
        `delete from friendships where requester_id = $1 and addressee_id = $2`,
        [alice, stranger]
      );
    }
  });
});

describe("list tables", () => {
  it("hides a non-friend's anime list", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from user_anime_entries where user_id = $1`,
      [stranger]
    );
    expect(rows).toHaveLength(0);
  });

  it("hides a non-friend's series list", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from user_franchise_entries where user_id = $1`,
      [stranger]
    );
    expect(rows).toHaveLength(0);
  });
});

describe("comments and votes", () => {
  it("hides them when the parent entry is hidden", async () => {
    expect(
      await db.as(
        { id: alice },
        `select id from comments where entry_id = $1`,
        [strangerEntry]
      )
    ).toHaveLength(0);
    expect(
      await db.as({ id: alice }, `select id from votes where entry_id = $1`, [
        strangerEntry,
      ])
    ).toHaveLength(0);
  });

  it("shows a whole thread when the entry is visible, whoever commented", async () => {
    // can_view_entry keys off the entry's AUTHOR, not the commenter — so a
    // visible thread renders in full rather than half-empty.
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'from a stranger')
       returning id`,
      [aliceEntry, stranger]
    );

    const rows = await db.as(
      { id: bob },
      `select id from comments where id = $1`,
      [commentId]
    );
    expect(rows).toHaveLength(1);
  });
});

describe("comment votes", () => {
  it("hides them when the parent entry is hidden", async () => {
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'stranger comment')
       returning id`,
      [strangerEntry, stranger]
    );
    await db.asService(
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)`,
      [commentId, stranger]
    );

    const rows = await db.as(
      { id: alice },
      `select id from comment_votes where comment_id = $1`,
      [commentId]
    );
    expect(rows).toHaveLength(0);
  });

  it("shows a whole thread's votes when the entry is visible, whoever voted", async () => {
    // can_view_comment routes through can_view_entry, keyed off the entry's
    // author — so a visible comment's votes are visible whoever cast them.
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'alice-side comment')
       returning id`,
      [aliceEntry, alice]
    );
    const [{ id: voteId }] = await db.asService<{ id: string }>(
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)
       returning id`,
      [commentId, stranger]
    );

    const rows = await db.as(
      { id: bob },
      `select id from comment_votes where id = $1`,
      [voteId]
    );
    expect(rows).toHaveLength(1);
  });
});

describe("vote mutation authorization", () => {
  // Regression coverage for a fix to `votes`/`comment_votes`: the UPDATE
  // policy's USING clause used to be `auth.uid() is not null` — any
  // authenticated user, not just the row's owner — so anyone who could see a
  // vote row (SELECT is visibility-gated, so any mutual friend could) could
  // retarget it by primary key and overwrite it with their own vote. INSERT
  // also never checked the voter could see the thing being voted on. Revert
  // either policy and these go red.

  it("blocks a friend from hijacking another user's vote via UPDATE", async () => {
    // Alice votes on her own entry, so Bob (her friend) can see the row and
    // target it by id. Clear any row a previous test left behind first —
    // asService writes aren't rolled back, and (entry_id, user_id) is
    // unique now.
    await db.asService(
      `delete from votes where entry_id = $1 and user_id = $2`,
      [aliceEntry, alice]
    );
    const [{ id: voteId }] = await db.asService<{ id: string }>(
      `insert into votes (entry_id, user_id, vote) values ($1, $2, 1) returning id`,
      [aliceEntry, alice]
    );

    const rows = await db.as(
      { id: bob },
      `update votes set vote = -1 where id = $1 returning vote`,
      [voteId]
    );
    expect(rows).toHaveLength(0);

    const [row] = await db.asService<{ vote: number }>(
      `select vote from votes where id = $1`,
      [voteId]
    );
    expect(row.vote).toBe(1);
  });

  it("lets the owner update their own vote", async () => {
    await db.asService(
      `delete from votes where entry_id = $1 and user_id = $2`,
      [aliceEntry, alice]
    );
    const [{ id: voteId }] = await db.asService<{ id: string }>(
      `insert into votes (entry_id, user_id, vote) values ($1, $2, 1) returning id`,
      [aliceEntry, alice]
    );

    const rows = await db.as(
      { id: alice },
      `update votes set vote = -1 where id = $1 returning vote`,
      [voteId]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].vote).toBe(-1);
  });

  it("blocks inserting a vote on an entry the voter cannot see", async () => {
    const error = await db.expectRejected(
      { id: alice },
      `insert into votes (entry_id, user_id, vote) values ($1, $2, 1)`,
      [strangerEntry, alice]
    );
    expect(error.code).toBe("42501");
  });

  it("blocks a friend from hijacking another user's comment vote via UPDATE", async () => {
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'hijack target')
       returning id`,
      [aliceEntry, alice]
    );
    const [{ id: voteId }] = await db.asService<{ id: string }>(
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)
       returning id`,
      [commentId, alice]
    );

    const rows = await db.as(
      { id: bob },
      `update comment_votes set vote = -1 where id = $1 returning vote`,
      [voteId]
    );
    expect(rows).toHaveLength(0);

    const [row] = await db.asService<{ vote: number }>(
      `select vote from comment_votes where id = $1`,
      [voteId]
    );
    expect(row.vote).toBe(1);
  });

  it("blocks inserting a comment vote on a comment the voter cannot see", async () => {
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'invisible to alice')
       returning id`,
      [strangerEntry, stranger]
    );

    const error = await db.expectRejected(
      { id: alice },
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)`,
      [commentId, alice]
    );
    expect(error.code).toBe("42501");
  });
});

describe("comments insert authorization", () => {
  // Regression coverage for a fix to comments' INSERT policy: it used to be
  // `with check (true)` — no ownership or visibility check at all — so any
  // authenticated user could forge a comment under someone else's user_id,
  // or attach a comment to an entry they cannot see. Revert the policy and
  // these go red.

  it("blocks inserting a comment with a spoofed user_id", async () => {
    const error = await db.expectRejected(
      { id: bob },
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'not really bob')`,
      [aliceEntry, alice]
    );
    expect(error.code).toBe("42501");
  });

  it("blocks inserting a comment on an entry the commenter cannot see", async () => {
    const error = await db.expectRejected(
      { id: alice },
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'blind comment')`,
      [strangerEntry, alice]
    );
    expect(error.code).toBe("42501");
  });

  it("lets a friend comment on a visible entry under their own identity", async () => {
    const rows = await db.as(
      { id: bob },
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'nice review')
       returning id`,
      [aliceEntry, bob]
    );
    expect(rows).toHaveLength(1);
  });
});

describe("vote uniqueness", () => {
  // Regression coverage for the fix to a TOCTOU race in castTableVote: two
  // near-simultaneous requests could both see "no existing vote" and both
  // insert, producing two rows for one user + target. These constraints turn
  // that into a rejected second insert instead of a silent duplicate.

  it("rejects a second vote row for the same user and entry", async () => {
    await db.asService(
      `delete from votes where entry_id = $1 and user_id = $2`,
      [aliceEntry, alice]
    );
    await db.asService(
      `insert into votes (entry_id, user_id, vote) values ($1, $2, 1)`,
      [aliceEntry, alice]
    );

    const error = await db.expectRejected(
      { id: alice },
      `insert into votes (entry_id, user_id, vote) values ($1, $2, -1)`,
      [aliceEntry, alice]
    );
    expect(error.code).toBe("23505");
  });

  it("rejects a second comment-vote row for the same user and comment", async () => {
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'uniqueness target')
       returning id`,
      [aliceEntry, alice]
    );
    await db.asService(
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)`,
      [commentId, alice]
    );

    const error = await db.expectRejected(
      { id: alice },
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, -1)`,
      [commentId, alice]
    );
    expect(error.code).toBe("23505");
  });
});

describe("get_comments_with_counts", () => {
  it("is not SECURITY DEFINER", async () => {
    // Same reasoning as get_entries_with_counts: definer would stop it
    // inheriting comments' SELECT policy and reopen global visibility.
    const [row] = await db.asService<{ prosecdef: boolean }>(
      `select prosecdef from pg_proc where proname = 'get_comments_with_counts'`
    );
    expect(row.prosecdef).toBe(false);
  });

  it("returns only what the caller may see", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from get_comments_with_counts($1)`,
      [strangerEntry]
    );
    expect(rows).toHaveLength(0);
  });

  it("includes aggregated vote counts for a visible thread", async () => {
    const [{ id: commentId }] = await db.asService<{ id: string }>(
      `insert into comments (entry_id, user_id, content) values ($1, $2, 'counted')
       returning id`,
      [aliceEntry, alice]
    );
    await db.asService(
      `insert into comment_votes (comment_id, user_id, vote) values ($1, $2, 1)`,
      [commentId, bob]
    );

    const rows = await db.as<{ likes_count: number; user_vote: number | null }>(
      { id: bob },
      `select likes_count, user_vote from get_comments_with_counts($1) where id = $2`,
      [aliceEntry, commentId]
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].likes_count)).toBe(1);
    expect(rows[0].user_vote).toBe(1);
  });
});

describe("get_entries_with_counts", () => {
  it("is not SECURITY DEFINER", async () => {
    // Making it definer would silently reopen global visibility: it would stop
    // inheriting the entries policy that covers the feed, /entry/:id, anime
    // pages, series pages and the friends page all at once.
    const [row] = await db.asService<{ prosecdef: boolean }>(
      `select prosecdef from pg_proc where proname = 'get_entries_with_counts'`
    );
    expect(row.prosecdef).toBe(false);
  });

  it("returns only what the caller may see", async () => {
    const rows = await db.as<{ user_id: string }>(
      { id: alice },
      `select user_id from get_entries_with_counts()`
    );
    const authors = new Set(rows.map((r) => r.user_id));

    expect(authors.has(alice)).toBe(true);
    expect(authors.has(stranger)).toBe(false);
  });
});

describe("world-readable by design", () => {
  // Username search and add-by-username depend on this staying open even to
  // anon. Locking it down would break those features, so the openness is
  // asserted rather than left to chance.
  it("keeps profiles readable", async () => {
    const rows = await db.as(
      { id: alice },
      `select id from profiles where id = $1`,
      [stranger]
    );
    expect(rows).toHaveLength(1);
  });
});

describe("authenticated-only by design", () => {
  // Friend counts and read-only friends pages depend on this staying open to
  // any signed-in user (not just mutual friends) — but not to anon, which
  // could otherwise crawl the whole social graph while unauthenticated.
  it("keeps friendships readable to any signed-in user", async () => {
    const rows = await db.as({ id: stranger }, `select id from friendships`);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("returns nothing at all to an anonymous reader", async () => {
    const rows = await db.as("anon", `select id from friendships`);
    expect(rows).toHaveLength(0);
  });
});
