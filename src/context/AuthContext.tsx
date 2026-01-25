/**
 * src/context/AuthContext.tsx
 *
 * Creates an empty 'container' that will hold auth data
 */
import { createContext } from "react";
import type { User, AuthError, AuthResponse } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
