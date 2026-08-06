/**
 * tests/rls/friendships.test.ts
 *
 * `friendships` writes are the authorization boundary for the whole app:
 * anyone who can write `status = 'accepted'` naming a victim grants themselves
 * that victim's entire feed, list and comment history. The policies, the
 * column grant and the trigger are three independent guards against that, and
 * each is tested separately so a regression in one isn't masked by another.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestDb, createTestDatabase, createUser, dropTestDatabase } from "./db";

const DB_NAME = "issho_rls_friendships";

let db: TestDb;
let attacker: string;
let victim: string;
let bystander: string;

beforeAll(async () => {
  const url = await createTestDatabase(DB_NAME);
  db = await TestDb.open(url);

  attacker = await createUser(db, "attacker");
  victim = await createUser(db, "victim");
  bystander = await createUser(db, "bystander");
}, 60_000);

afterAll(async () => {
  await db?.close();
  await dropTestDatabase(DB_NAME);
});

/** Remove any friendship between two users, whichever way round it was made. */
const clearFriendships = () => db.asService(`delete from friendships`);

describe("insert", () => {
  it("allows a pending request from the requester", async () => {
    const rows = await db.as(
      { id: attacker },
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending') returning id`,
      [attacker, victim]
    );
    expect(rows).toHaveLength(1);
  });

  it("refuses a request that starts out accepted", async () => {
    // The escalation attempt the policy exists to stop.
    const error = await db.expectRejected(
      { id: attacker },
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'accepted')`,
      [attacker, victim]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses a request sent on someone else's behalf", async () => {
    const error = await db.expectRejected(
      { id: attacker },
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [bystander, victim]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses an anonymous request", async () => {
    const error = await db.expectRejected(
      "anon",
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [attacker, victim]
    );
    expect(error.code).toBe("42501");
  });
});

describe("accepting", () => {
  beforeAll(async () => {
    await clearFriendships();
    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [attacker, victim]
    );
  });

  it("lets the addressee accept", async () => {
    const rows = await db.as(
      { id: victim },
      `update friendships set status = 'accepted'
       where requester_id = $1 and addressee_id = $2 returning id`,
      [attacker, victim]
    );
    expect(rows).toHaveLength(1);
  });

  it("does not let the requester accept their own request", async () => {
    // Otherwise sending a request would be the same as being granted access.
    const rows = await db.as(
      { id: attacker },
      `update friendships set status = 'accepted'
       where requester_id = $1 and addressee_id = $2 returning id`,
      [attacker, victim]
    );
    expect(rows).toHaveLength(0);
  });

  it("does not let an uninvolved third party accept", async () => {
    const rows = await db.as(
      { id: bystander },
      `update friendships set status = 'accepted'
       where requester_id = $1 and addressee_id = $2 returning id`,
      [attacker, victim]
    );
    expect(rows).toHaveLength(0);
  });

  it("makes a second accept a no-op rather than an error", async () => {
    // `using (status = 'pending')` is what gives acceptFriendRequest its
    // idempotency: the second call matches zero rows instead of throwing.
    await db.asService(`update friendships set status = 'accepted'`);
    try {
      const rows = await db.as(
        { id: victim },
        `update friendships set status = 'accepted'
         where requester_id = $1 and addressee_id = $2 returning id`,
        [attacker, victim]
      );
      expect(rows).toHaveLength(0);
    } finally {
      await db.asService(`update friendships set status = 'pending'`);
    }
  });
});

describe("column grants", () => {
  it("gives authenticated UPDATE on status and nothing else", async () => {
    const rows = await db.asService<{ column_name: string }>(
      `select column_name from information_schema.column_privileges
       where table_name = 'friendships' and grantee = 'authenticated'
         and privilege_type = 'UPDATE'`
    );
    expect(rows.map((r) => r.column_name)).toEqual(["status"]);
  });

  it("refuses to update any other column", async () => {
    // A table-wide UPDATE grant would silently reopen the repoint attack,
    // because a column-level revoke cannot subtract from one.
    const error = await db.expectRejected(
      { id: victim },
      `update friendships set updated_at = now()`
    );
    expect(error.code).toBe("42501");
  });

  it("gives anon no UPDATE at all", async () => {
    const rows = await db.asService(
      `select 1 from information_schema.column_privileges
       where table_name = 'friendships' and grantee = 'anon'
         and privilege_type = 'UPDATE'`
    );
    expect(rows).toHaveLength(0);
  });
});

describe("identity immutability trigger", () => {
  beforeAll(async () => {
    await clearFriendships();
    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [attacker, victim]
    );
  });

  it("stops authenticated at the column grant, before the trigger", async () => {
    const error = await db.expectRejected(
      { id: victim },
      `update friendships set addressee_id = $1 where addressee_id = $2`,
      [bystander, victim]
    );
    expect(error.code).toBe("42501");
  });

  it("refuses to repoint a friendship even for a privileged writer", async () => {
    // Defence in depth. `authenticated` never gets this far — the column grant
    // above stops it — so the trigger is exercised as service_role, which
    // bypasses RLS and holds the column privileges a compromised backend
    // path would have.
    await expect(
      db.asService(
        `update friendships set addressee_id = $1 where addressee_id = $2`,
        [bystander, victim]
      )
    ).rejects.toMatchObject({
      code: "23514",
      message: expect.stringContaining("immutable"),
    });
  });

  it("allows a status-only update to pass the trigger", async () => {
    const rows = await db.as(
      { id: victim },
      `update friendships set status = 'accepted'
       where addressee_id = $1 returning id`,
      [victim]
    );
    expect(rows).toHaveLength(1);
  });
});

describe("deleting", () => {
  beforeAll(async () => {
    await clearFriendships();
    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'accepted')`,
      [attacker, victim]
    );
  });

  it("lets either party delete — which is how reject, cancel and unfriend all work", async () => {
    expect(
      await db.as({ id: attacker }, `delete from friendships returning id`)
    ).toHaveLength(1);
    expect(
      await db.as({ id: victim }, `delete from friendships returning id`)
    ).toHaveLength(1);
  });

  it("does not let a third party delete someone else's friendship", async () => {
    const rows = await db.as(
      { id: bystander },
      `delete from friendships returning id`
    );
    expect(rows).toHaveLength(0);
  });
});

describe("table constraints", () => {
  it("refuses a self-friendship", async () => {
    const error = await db.expectRejected(
      { id: attacker },
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $1, 'pending')`,
      [attacker]
    );
    expect(error.code).toBe("23514");
  });

  it("refuses a duplicate request in the same direction", async () => {
    await clearFriendships();
    await db.asService(
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [attacker, victim]
    );

    const error = await db.expectRejected(
      { id: attacker },
      `insert into friendships (requester_id, addressee_id, status)
       values ($1, $2, 'pending')`,
      [attacker, victim]
    );
    expect(error.code).toBe("23505");
  });
});
