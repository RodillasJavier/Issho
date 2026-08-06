/**
 * src/hooks/useFranchiseMembers.test.ts
 *
 * Covers the cache-seeding side effect's two guards. Neither throws when
 * broken — the symptom is silent: either a fresher `["anime", id]` entry
 * (e.g. one AnimeFeed just fetched directly) gets clobbered by a stale
 * franchise batch response, or every member gets rewritten on every refetch
 * even when nothing changed.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFranchiseMembers } from "./useFranchiseMembers";
import { makeAnime } from "../test/factories";

vi.mock("../supabase-client", () => ({ default: {} }));

const { fetchFranchiseMembers } = vi.hoisted(() => ({
  fetchFranchiseMembers: vi.fn(),
}));
vi.mock("../services/supabase/franchises", () => ({ fetchFranchiseMembers }));

const renderWithClient = (queryClient: QueryClient, franchiseKey: number) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useFranchiseMembers(franchiseKey), { wrapper });
};

describe("useFranchiseMembers cache seeding", () => {
  it("seeds each member's own anime cache entry from the batch fetch", async () => {
    const member = makeAnime({ id: "member-1", name: "Season One" });
    fetchFranchiseMembers.mockResolvedValue([member]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderWithClient(queryClient, 1);
    await waitFor(() => expect(result.current.franchiseMembers).toBeDefined());

    expect(queryClient.getQueryData(["anime", "member-1"])).toEqual(member);
  });

  it("does not clobber a fresher anime entry with an older franchise batch response", async () => {
    const staleMember = makeAnime({ id: "member-1", name: "Stale name" });
    fetchFranchiseMembers.mockResolvedValue([staleMember]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const freshMember = makeAnime({ id: "member-1", name: "Fresh name" });
    queryClient.setQueryData(["anime", "member-1"], freshMember, {
      updatedAt: Date.now() + 60_000, // newer than the batch fetch about to resolve
    });

    const { result } = renderWithClient(queryClient, 1);
    await waitFor(() => expect(result.current.franchiseMembers).toBeDefined());

    expect(queryClient.getQueryData(["anime", "member-1"])).toEqual(
      freshMember
    );
  });

  it("skips a redundant rewrite when the cached row already matches the incoming member", async () => {
    const unchanged = makeAnime({ id: "member-1", name: "Unchanged" });
    const changed = makeAnime({ id: "member-2", name: "Changed (new)" });
    fetchFranchiseMembers.mockResolvedValue([unchanged, changed]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(["anime", "member-1"], unchanged, {
      updatedAt: 0,
    });
    queryClient.setQueryData(
      ["anime", "member-2"],
      makeAnime({ id: "member-2", name: "Changed (old)" }),
      { updatedAt: 0 }
    );

    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const { result } = renderWithClient(queryClient, 1);
    await waitFor(() => expect(result.current.franchiseMembers).toBeDefined());

    const seededKeys = setQueryData.mock.calls
      .filter(([key]) => Array.isArray(key) && key[0] === "anime")
      .map(([key]) => (key as unknown[])[1]);

    expect(seededKeys).toContain("member-2");
    expect(seededKeys).not.toContain("member-1");
    expect(queryClient.getQueryData(["anime", "member-2"])).toEqual(changed);
  });
});
