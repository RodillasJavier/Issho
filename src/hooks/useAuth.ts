/**
 * src/hooks/useAuth.ts
 *
 * Gets auth data from the context and makes it available to any component.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
