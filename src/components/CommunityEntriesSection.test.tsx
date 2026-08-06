/**
 * src/components/CommunityEntriesSection.test.tsx
 *
 * Covers the two state-adjustment-during-render branches added for
 * pagination: resetting to page 1 on a season/franchise navigation
 * (`resetKey` change), and clamping the page back down when the underlying
 * `entries` array shrinks independent of `resetKey` (a background refetch
 * returning fewer rows). Both are easy to regress silently since neither
 * throws — the symptom is a stuck/empty page.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import { CommunityEntriesSection } from "./CommunityEntriesSection";
import type { Entry } from "../types/database.types";

vi.mock("../supabase-client", () => ({ default: {} }));

let idCounter = 0;
const makeEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: `entry-${(idCounter += 1)}`,
  created_at: "2026-01-01T00:00:00.000Z",
  content: null,
  anime_id: "anime-1",
  entry_type: "status_update",
  user_id: "user-1",
  rating_value: null,
  status_value: null,
  franchise_key: null,
  likes_count: 0,
  dislikes_count: 0,
  comment_count: 0,
  user_vote: null,
  ...overrides,
});

const makeEntries = (count: number): Entry[] =>
  Array.from({ length: count }, () => makeEntry());

const prevPageButton = () =>
  screen.getByRole("button", { name: "Previous page" });
const nextPageButton = () => screen.getByRole("button", { name: "Next page" });

describe("CommunityEntriesSection pagination", () => {
  it("resets to page 1 when resetKey changes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CommunityEntriesSection
        entries={makeEntries(25)}
        emptyMessage="empty"
        resetKey="season-a"
      />
    );

    await user.click(nextPageButton());
    expect(prevPageButton()).toBeEnabled();

    rerender(
      <CommunityEntriesSection
        entries={makeEntries(25)}
        emptyMessage="empty"
        resetKey="season-b"
      />
    );

    expect(prevPageButton()).toBeDisabled();
  });

  it("does not reset the page when entries change but resetKey stays the same", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(25);
    const { rerender } = renderWithProviders(
      <CommunityEntriesSection
        entries={entries}
        emptyMessage="empty"
        resetKey="season-a"
      />
    );

    await user.click(nextPageButton());
    expect(prevPageButton()).toBeEnabled();

    // Same resetKey, new array reference (e.g. a vote mutation patched the
    // cache) — the page should not snap back to 1.
    rerender(
      <CommunityEntriesSection
        entries={[...entries]}
        emptyMessage="empty"
        resetKey="season-a"
      />
    );

    expect(prevPageButton()).toBeEnabled();
  });

  it("clamps the current page down when entries shrinks below it, independent of resetKey", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CommunityEntriesSection
        entries={makeEntries(25)}
        emptyMessage="empty"
        resetKey="season-a"
      />
    );

    await user.click(nextPageButton());
    await user.click(nextPageButton());
    expect(prevPageButton()).toBeEnabled();
    expect(nextPageButton()).toBeDisabled();

    // Same resetKey, but the feed query refetched and now returns fewer
    // entries than would fill the page the viewer was sitting on.
    rerender(
      <CommunityEntriesSection
        entries={makeEntries(5)}
        emptyMessage="empty"
        resetKey="season-a"
      />
    );

    expect(prevPageButton()).toBeDisabled();
    expect(nextPageButton()).toBeDisabled();
  });
});
