/**
 * src/components/BackButton.test.tsx
 *
 * The whole point of this component is the fallback: `navigate(-1)` on a
 * location react-router stamped as "default" (a fresh load, refresh, or
 * direct link — no in-app history to walk back through) would leave the app
 * or no-op. Mocking react-router directly (rather than driving a real
 * MemoryRouter) is what lets this test assert on the exact `location.key`
 * boundary the component branches on, including the "default" sentinel that
 * a real createBrowserHistory only produces on an actual fresh page load.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BackButton } from "./BackButton";

const navigate = vi.fn();
let locationKey = "abc123";

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ key: locationKey }),
}));

describe("BackButton", () => {
  it("walks real history back when there is an in-app entry to return to", () => {
    locationKey = "abc123";
    render(<BackButton href="/fallback" />);

    fireEvent.click(screen.getByRole("button"));

    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it("falls back to href on a fresh load/direct link with no in-app history", () => {
    locationKey = "default";
    render(<BackButton href="/fallback" />);

    fireEvent.click(screen.getByRole("button"));

    expect(navigate).toHaveBeenCalledWith("/fallback");
  });
});
