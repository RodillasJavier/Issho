/**
 * src/context/AuthContext.tsx
 *
 * Creates an empty 'container' that will hold auth data
 */
import { createContext } from "react";
import type { User, AuthError, AuthResponse } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  /**
   * Whether the initial session lookup is still in flight. Until it settles,
   * `user` being null means "not known yet", not "signed out" — consumers that
   * would otherwise render the signed-out half of the UI should wait.
   *
   * Covers only that one-shot lookup. It is never true during
   * `signInWithEmail` and friends, which report their own errors.
   */
  initializing: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (
    email: string
  ) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  resendConfirmationEmail: (
    email: string
  ) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
