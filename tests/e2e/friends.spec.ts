/**
 * tests/e2e/friends.spec.ts
 *
 * The flow where the UI and the security model meet: accepting a friend
 * request is the single action that changes what someone can see. The RLS
 * suite proves the policy; this proves the app is really behind it, end to
 * end, through two browser sessions.
 *
 * Serial because both tests mutate the same friendship, and the seed is only
 * reset between full runs.
 */
import { expect, test } from "@playwright/test";
import { SEED, USERS, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("a friend request grants visibility only once accepted", async ({
  browser,
}) => {
  const aliceCtx = await browser.newContext();
  const carolCtx = await browser.newContext();
  const alice = await aliceCtx.newPage();
  const carol = await carolCtx.newPage();

  try {
    // Alice cannot see Carol's activity: they aren't friends.
    await signIn(alice, "alice");
    await expect(alice.getByText(SEED.carolEntry)).toHaveCount(0);

    // Carol sends Alice a request.
    await signIn(carol, "carol");
    await carol.goto(`/profile/${USERS.carol.username}/friends`);
    await carol.getByLabel("Friend username").fill(USERS.alice.username);
    await carol.getByRole("button", { name: "Send" }).click();
    await expect(carol.getByText(/sent|pending|request/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Still nothing — a pending request grants nothing.
    await alice.reload();
    await expect(alice.getByText(SEED.carolEntry)).toHaveCount(0);

    // Alice accepts.
    await alice.goto(`/profile/${USERS.alice.username}/friends`);
    await expect(alice.getByText(USERS.carol.username).first()).toBeVisible({
      timeout: 10_000,
    });
    await alice.getByRole("button", { name: "Accept" }).click();

    // Wait for the request to leave the pending list, so the accept has
    // actually landed before we navigate away from it.
    await expect(alice.getByRole("button", { name: "Accept" })).toHaveCount(0, {
      timeout: 10_000,
    });

    // Now Carol's entry is in Alice's feed.
    await alice.goto("/");
    await expect(alice.getByText(SEED.carolEntry).first()).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await aliceCtx.close();
    await carolCtx.close();
  }
});

test("the friends page hides its controls on someone else's profile", async ({
  page,
}) => {
  // Add-by-username and incoming requests only ever render on your own page.
  await signIn(page, "alice");

  await page.goto(`/profile/${USERS.alice.username}/friends`);
  await expect(page.getByLabel("Friend username")).toBeVisible();

  await page.goto(`/profile/${USERS.bob.username}/friends`);
  await expect(page.getByLabel("Friend username")).toHaveCount(0);
});
