/**
 * src/context/AuthProvider.test.tsx
 *
 * `initializing` gates the whole app's signed-in/signed-out rendering, so the
 * one thing it must never do is stay true. In particular a failed session
 * lookup still answers the question "do we know who this is?" — the answer is
 * just "nobody".
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { AuthProvider } from "./AuthProvider";

type AuthCallback = (event: string, session: unknown) => void;

const unsubscribe = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn((_callback: AuthCallback) => ({
  data: { subscription: { unsubscribe } },
}));

vi.mock("../supabase-client", () => ({
  default: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: (callback: AuthCallback) =>
        onAuthStateChange(callback),
    },
  },
}));

const Probe = () => {
  const auth = useContext(AuthContext);
  return (
    <div>
      <span data-testid="initializing">{String(auth?.initializing)}</span>
      <span data-testid="user">{auth?.user?.id ?? "none"}</span>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

const initializing = () => screen.getByTestId("initializing").textContent;

describe("AuthProvider initializing", () => {
  it("starts true and clears once a session resolves", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    renderProvider();
    await waitFor(() => expect(initializing()).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("user-1");
  });

  it("clears when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    renderProvider();
    await waitFor(() => expect(initializing()).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("clears even when the session lookup rejects", async () => {
    // Without the `.finally`, this leaves the app on its loading state
    // forever — every page stuck rendering a skeleton.
    getSession.mockRejectedValue(new Error("network down"));

    renderProvider();
    await waitFor(() => expect(initializing()).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("clears when onAuthStateChange fires before getSession settles", async () => {
    let emit: AuthCallback | undefined;
    onAuthStateChange.mockImplementationOnce((callback) => {
      emit = callback;
      return { data: { subscription: { unsubscribe } } };
    });
    getSession.mockReturnValue(new Promise(() => {})); // never settles

    renderProvider();
    emit?.("SIGNED_IN", { user: { id: "user-2" } });

    await waitFor(() => expect(initializing()).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("user-2");
  });

  it("unsubscribes on unmount", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    const { unmount } = renderProvider();
    await waitFor(() => expect(initializing()).toBe("false"));
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
