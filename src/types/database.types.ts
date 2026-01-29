/**
 * 
 * src/types/database.types.ts

 * Database-related TypeScript types and interfaces.
 */

export type EntryType = "review" | "rating" | "status_update";
export type AnimeStatus = "not_started" | "watching" | "completed" | "dropped";

export interface Anime {
  id: string;
  created_at: string;
  name: string;
  description: string;
  episode_count: number | null;
  cover_image_url: string;
  year: number | null;
  external_id: string;
}

export interface Entry {
  id: string;
  created_at: string;
  content: string | null;
  anime_id: string;
  entry_type: EntryType;
  user_id: string;
  anime?: Anime; // When joined
  vote_count?: number; // When aggregated
  comment_count?: number; // When aggregated
  user_vote?: number; // User's vote (-1, 0, 1)
}

export interface Vote {
  id: string;
  created_at: string;
  entry_id: string;
  user_id: string;
  vote: number; // -1 or 1
}

export interface Comment {
  id: string;
  created_at: string;
  entry_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_spoiler: boolean;
  children?: Comment[]; // When nested
}

export interface UserAnimeEntry {
  id: string;
  created_at: string;
  user_id: string;
  anime_id: string;
  status: AnimeStatus;
  rating: number | null;
  review: string | null;
  updated_at: string;
  anime?: Anime; // When joined
}
