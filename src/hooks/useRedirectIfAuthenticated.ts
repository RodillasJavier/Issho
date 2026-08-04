/**
 * src/hooks/useRedirectIfAuthenticated.ts
 *
 * Sends an already-signed-in visitor away from a page meant only for
 * signed-out users (sign in / sign up) as soon as auth state resolves.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./useAuth";

export const useRedirectIfAuthenticated = (to = "/") => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(to, { replace: true });
  }, [user, to, navigate]);
};
