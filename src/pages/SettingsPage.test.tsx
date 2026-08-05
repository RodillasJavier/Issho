/**
 * src/pages/SettingsPage.test.tsx
 *
 * Regression cover for the auth-initialization bug: this page is the only one
 * that redirects on `!user`, and until `initializing` existed it fired that
 * redirect on the indeterminate first paint. A signed-in visitor hard-loading
 * /settings was sent to /signin, which then forwarded them to "/" — losing the
 * page they asked for, query string and all.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, testUser } from "../test/renderWithProviders";
import { SettingsPage } from "./SettingsPage";

vi.mock("../supabase-client", () => ({ default: {} }));

// Only the fetch is stubbed: the settings sections import constants from this
// module too, and replacing it wholesale strips those out.
vi.mock("../services/supabase/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/supabase/profiles")>()),
  getProfileById: vi.fn(async () => ({
    id: "user-1",
    username: "tester",
    bio: null,
    avatar_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
  })),
}));

const renderAt = (
  route: string,
  auth: Parameters<typeof renderWithProviders>[1]
) =>
  renderWithProviders(<SettingsPage />, { ...auth, route, path: "/settings" });

describe("SettingsPage auth guard", () => {
  it("waits instead of redirecting while the session is still resolving", () => {
    const { location } = renderAt("/settings", {
      auth: { user: null, initializing: true },
    });

    expect(location.pathname).toBe("/settings");
  });

  it("redirects to /signin once we know there is no session", () => {
    const { location } = renderAt("/settings", {
      auth: { user: null, initializing: false },
    });

    expect(location.pathname).toBe("/signin");
  });

  it("stays put for a signed-in visitor", async () => {
    const { location } = renderAt("/settings", {
      auth: { user: testUser(), initializing: false },
    });

    expect(location.pathname).toBe("/settings");
    expect(await screen.findByText("Public profile")).toBeInTheDocument();
  });

  it("keeps the ?tab= deep link the confirmation email relies on", async () => {
    // The email-confirmation link lands on ?tab=account; the old redirect
    // dropped the whole URL.
    const { location } = renderAt("/settings?tab=account", {
      auth: { user: testUser(), initializing: false },
    });

    expect(location.pathname).toBe("/settings");
    expect(await screen.findByText("Email address")).toBeInTheDocument();
  });
});
