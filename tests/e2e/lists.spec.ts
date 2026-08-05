/**
 * tests/e2e/lists.spec.ts
 *
 * Adding a season and tracking a series — the two list levels, and the rule
 * that connects them: adding a season of a multi-member franchise also seeds a
 * series row, so the profile shows the show rather than a lone season.
 *
 * Navigates by seeded id rather than by clicking through the catalogue. The
 * browse grid links a multi-season franchise to /series/:key, not to any one
 * season, so clicking through can't reach a season detail page at all.
 *
 * Acts as carol, whose list the seed leaves empty and whom no other spec
 * writes to. friends.spec permanently changes alice's friendships, so sharing
 * her here would make these assertions depend on file order.
 */
import { expect, test } from "@playwright/test";
import { SEED, USERS, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

const SEASON_ONE_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const FILM_ID = "bbbbbbbb-0000-0000-0000-000000000001";
const FRANCHISE_KEY = 101;

test("adds a season to the list, and the profile shows the series", async ({
  page,
}) => {
  await signIn(page, "carol");
  await page.goto(`/anime/${SEASON_ONE_ID}`);
  await expect(page.getByText(SEED.seasonOne).first()).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "+ Add to list" }).click();
  await page.getByRole("button", { name: "Watching", exact: true }).click();

  // The trigger becomes the current status once the write lands.
  await expect(page.getByRole("button", { name: /Watching/ })).toBeVisible({
    timeout: 15_000,
  });

  // ...and the profile reflects it. Asserted on the stat rather than the card
  // title: a card's headline comes from `franchiseDisplayTitle`, which
  // deliberately overrides the stored franchise_title with the earliest TV
  // member's name, so the text there depends on grouping rules this test
  // isn't about.
  // Case-insensitive: the stat labels are uppercased in CSS, so the DOM text
  // is "Watching" even though the page reads "WATCHING".
  await page.goto(`/profile/${USERS.carol.username}`);
  await expect(page.getByText(/^watching$/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/^total$/i).first()).toBeVisible();
});

test("the seeded series row makes the series page show it as tracked", async ({
  page,
}) => {
  // The other half of seedFranchiseEntry: adding a *season* should leave the
  // series itself tracked, not offering "Track whole series" as if untouched.
  await signIn(page, "carol");
  await page.goto(`/series/${FRANCHISE_KEY}`);

  await expect(
    page.getByRole("button", { name: "+ Track whole series" })
  ).toHaveCount(0, { timeout: 15_000 });
});

test("offers series-level tracking on the series page", async ({ page }) => {
  await signIn(page, "carol");
  await page.goto(`/series/${FRANCHISE_KEY}`);

  // Either the add CTA or a status, depending on what the previous test left.
  await expect(
    page
      .getByRole("button", { name: /Track whole series|Watching|Series:/ })
      .first()
  ).toBeVisible({ timeout: 15_000 });
});

test("a standalone film has no series level", async ({ page }) => {
  await signIn(page, "carol");
  await page.goto(`/anime/${FILM_ID}`);
  await expect(page.getByText(SEED.film).first()).toBeVisible({
    timeout: 15_000,
  });

  // No franchise_key, so the two-level UI must not appear.
  await expect(
    page.getByRole("button", { name: "+ Track whole series" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "+ Add to list" })
  ).toBeVisible();
});
