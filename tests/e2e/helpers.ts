/**
 * tests/e2e/helpers.ts
 *
 * Shared fixtures for the E2E suite. The accounts and titles here must match
 * supabase/seed.sql — that file is the source of truth.
 */
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "TestPass1!";

export const USERS = {
  /** Friends with bob. Sees bob's activity, never carol's. */
  alice: { email: "alice@example.test", username: "alice" },
  bob: { email: "bob@example.test", username: "bob" },
  /** Friends with nobody — the "must not be visible" case. */
  carol: { email: "carol@example.test", username: "carol" },
} as const;

export const SEED = {
  seasonOne: "Test Series Season One",
  seasonTwo: "Test Series Season Two",
  film: "Standalone Film",
  seriesTitle: "Test Series",
  bobEntry: "Bob thinks season one holds up.",
  carolEntry: "Carol on the standalone film. Alice must never see this.",
} as const;

/** Sign in through the real form, and wait until the app agrees. */
export const signIn = async (page: Page, user: keyof typeof USERS) => {
  await page.goto("/signin");
  await page.getByLabel("Email address").fill(USERS[user].email);
  // Exact: the reveal button's "Show password" aria-label matches otherwise.
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // useRedirectIfAuthenticated bounces off /signin once the session lands.
  await expect(page).toHaveURL("/", { timeout: 15_000 });
};
