/**
 * src/context/AuthProvider.tsx
 *
 * Manages the user state and handles authentication through Supabase. Wraps
 * the app and provides auth data to any component inside of it.
 */
import { AuthContext } from "./AuthContext";
import { useEffect, useState } from "react";
import supabase from "../supabase-client";
import type { User } from "@supabase/supabase-js";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch(() => {
        // Can't identify the visitor, so treat them as signed out. Swallowed
        // rather than rethrown: an unhandled rejection here would surface as a
        // console error on every offline load.
        setUser(null);
      })
      // `finally`, not `then`: a failed session lookup still resolves the
      // question of whether we know who the user is. Leaving `initializing`
      // set would strand the whole app on its loading state.
      .finally(() => {
        setInitializing(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      // This can fire before `getSession` settles; either one arriving is
      // enough to stop treating auth as unknown.
      setInitializing(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      setUser(data.session.user);
    }

    return { data, error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error && data.session) {
      setUser(data.session.user);
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    return { error };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
