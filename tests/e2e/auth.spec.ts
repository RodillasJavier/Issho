/**
 * tests/e2e/auth.spec.ts
 *
 * Sign-in, and the two auth-shaped contracts that are easy to break by
 * accident: there is no ProtectedRoute in this app, and /settings must survive
 * a cold load.
 */
import { expect, test } from "@playwright/test";
import { PASSWORD, SEED, USERS, signIn } from "./helpers";

test("signs in and lands on the feed", async ({ page }) => {
  await signIn(page, "alice");
  await expect(
    page.getByRole("heading", { name: "Recent activity" })
  ).toBeVisible();
});

test("rejects a wrong password without navigating away", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Email address").fill(USERS.alice.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/signin/);
});

test("keeps a signed-in visitor on /settings across a hard reload", async ({
  page,
}) => {
  // The Phase 0 regression. Before `initializing` existed, the first paint saw
  // user === null, redirected to /signin, and /signin then forwarded to "/" —
  // so a reload silently dropped you on the feed. Only a full page load
  // reproduces it, which is why this is an E2E rather than a component test.
  await signIn(page, "alice");

  await page.goto("/settings?tab=security");
  await expect(page).toHaveURL(/\/settings\?tab=security/);

  await page.reload();
  await expect(page).toHaveURL(/\/settings\?tab=security/);
  await expect(page.getByText("Password", { exact: true })).toBeVisible();
});

test("sends a signed-out visitor from /settings to /signin", async ({
  page,
}) => {
  // The other half of the same guard: it must still redirect once the session
  // is known to be absent.
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/signin/);
});

test.describe("no ProtectedRoute", () => {
  // Logged-out visitors get a rendered page with a sign-in CTA, NOT a
  // redirect. Only /settings redirects. Adding a blanket route guard would
  // break the public feed and the browsable catalogue, so the contract is
  // pinned here.
  for (const path of ["/entry/create", "/anime"]) {
    test(`renders ${path} for a logged-out visitor`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
      await expect(
        page.getByRole("link", { name: /sign in/i }).first()
      ).toBeVisible();
    });
  }
});

test("shows the anonymous public feed to a logged-out visitor", async ({
  page,
}) => {
  await page.goto("/");

  // Exact: the CTA below it also contains the words "public feed".
  await expect(page.getByText("Public feed", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Authors are hidden on the public feed.")
  ).toBeVisible();

  // The de-identified RPC never returns an author, so no username can appear.
  for (const user of Object.values(USERS)) {
    await expect(page.getByText(user.username, { exact: true })).toHaveCount(0);
  }
});

test("signs up a new account and asks for email confirmation", async ({
  page,
}) => {
  const email = `new-${Date.now()}@example.test`;

  await page.goto("/signup");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(
    page.getByRole("heading", { name: "Confirm your email" })
  ).toBeVisible({ timeout: 15_000 });
});

test("does not leak a non-friend's entry into the signed-in feed", async ({
  page,
}) => {
  // Alice is friends with Bob only. This is the friend gate as the user
  // actually experiences it — the RLS suite proves the policy, this proves
  // the app is really behind it.
  await signIn(page, "alice");

  // .first(): the top entry renders twice on page one, as the hero card and
  // again in the list below it.
  await expect(page.getByText(SEED.bobEntry).first()).toBeVisible();
  await expect(page.getByText(SEED.carolEntry)).toHaveCount(0);
});
