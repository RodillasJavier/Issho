/**
 * src/services/supabase/userSearch.ts
 *
 * API functions for searching users.
 */
import supabase from "../../supabase-client";
import type { Profile } from "../../types/database.types";

/**
 * Search users by username
 *
 * @param query - Search query (username)
 * @returns Array of matching profiles
 */
export const searchUsers = async (query: string): Promise<Profile[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .limit(10)
    .order("username");

  if (error) throw new Error(error.message);
  return data as Profile[];
};
