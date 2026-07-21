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
  updated_at: string;
  name: string;
  name_japanese: string | null; // Romanized or Japanese title
  description: string | null;
  episode_count: number | null;
  cover_image_url: string | null;
  year: number | null;
  external_id: number | null; // Legacy MAL ID (superseded by anilist_id/mal_id)
  genres: string | null;
  status: string | null; // "Finished Airing", "Currently Airing", etc.
  mal_url: string | null;
  anilist_id: number | null; // AniList media ID (external key going forward)
  mal_id: number | null; // MyAnimeList ID, preserved from external_id
  format: string | null; // AniList MediaFormat: TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC
  anilist_url: string | null;
  franchise_key: number | null; // AniList ID of the franchise's backbone root
  franchise_title: string | null; // Denormalized root title for grouped display
  banner_image_url: string | null; // Wide AniList banner art (null for many titles)
}

export interface AnimeInsert {
  name: string;
  name_japanese?: string | null;
  external_id?: number | null;
  cover_image_url?: string | null;
  description?: string | null;
  episode_count?: number | null;
  year?: number | null;
  genres?: string | null;
  status?: string | null;
  mal_url?: string | null;
  anilist_id?: number | null;
  mal_id?: number | null;
  format?: string | null;
  anilist_url?: string | null;
  franchise_key?: number | null;
  franchise_title?: string | null;
  banner_image_url?: string | null;
}

export interface Entry {
  id: string;
  created_at: string;
  content: string | null;
  anime_id: string;
  entry_type: EntryType;
  user_id: string;
  rating_value: number | null; // For "rating" entries (1-10)
  status_value: AnimeStatus | null; // For "status_update" entries
  anime?: Anime; // When joined
  profile?: Profile; // When joined
  likes_count?: number; // When aggregated
  dislikes_count?: number; // When aggregated
  comment_count?: number; // When aggregated
  user_vote?: number | null; // Current user's vote on this entry: 1, -1, or null
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
  profile?: Profile; // When joined
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

export interface UserFranchiseEntry {
  id: string;
  created_at: string;
  user_id: string;
  franchise_key: number; // Matches anime.franchise_key
  status: AnimeStatus;
  rating: number | null;
  review: string | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  username?: string;
  bio?: string;
  avatar_url?: string | null;
}

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;

  // When joined with profiles
  requester?: Profile;
  addressee?: Profile;
}

export interface FriendshipStatusInfo {
  friendship: Friendship | null;
  isFriend: boolean;
  isPending: boolean;
  isRequester: boolean; // true if current user sent the request
  isAddressee: boolean; // true if current user received the request
}
