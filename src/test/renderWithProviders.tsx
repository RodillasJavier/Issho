/**
 * src/test/renderWithProviders.tsx
 *
 * Renders a component inside the same provider stack as main.tsx
 * (QueryClientProvider > AuthContext > Router), with the auth value injected
 * directly. AuthContextType is exported, so tests can supply a session without
 * standing up AuthProvider and its Supabase calls.
 */
import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

/** A signed-in user, with only the fields components actually read. */
export const testUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "user-1",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as User;

export const testAuth = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => ({
  user: null,
  initializing: false,
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
  resendConfirmationEmail: vi.fn(),
  ...overrides,
});

/** Reports the router's current path so a test can assert on a redirect. */
const LocationProbe = ({ onChange }: { onChange: (path: string) => void }) => {
  onChange(useLocation().pathname);
  return null;
};

interface Options {
  auth?: Partial<AuthContextType>;
  /** Initial URL, and the pattern the element mounts at unless `path` is set. */
  route?: string;
  /** Route pattern to mount at, when the test needs to observe a redirect. */
  path?: string;
}

/**
 * Renders `ui`, returning a `location` probe so a test can assert where the
 * router ended up — which is how the redirect guards are checked.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { auth = {}, route = "/", path }: Options = {}
) => {
  // Retries would turn a deliberate query failure into a timeout.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const location = { pathname: route };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={testAuth(auth)}>
        <MemoryRouter initialEntries={[route]}>
          <LocationProbe
            onChange={(pathname) => {
              location.pathname = pathname;
            }}
          />
          {children}
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  const element = path ? (
    <Routes>
      <Route path={path} element={ui} />
      <Route path="*" element={null} />
    </Routes>
  ) : (
    ui
  );

  return { ...render(element, { wrapper }), location };
};
