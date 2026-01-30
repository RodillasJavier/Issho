/**
 * src/services/supabase/profiles.ts
 *
 * API functions for managing user profiles.
 */
import supabase from "../../supabase-client";
import type { Profile, ProfileUpdate } from "../../types/database.types";

/**
 * Get a profile by user ID
 *
 * @param userId uuid of the user
 * @returns the Profile object or null if not found
 */
export const getProfileById = async (
  userId: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
};

/**
 * Get a profile by username
 *
 * @param username username of the user
 * @returns the Profile object or null if not found
 */
export const getProfileByUsername = async (
  username: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
};

/**
 * Update the current user's profile
 *
 * @param userId uuid of the user
 * @param updates partial updates to apply to the profile
 * @returns the updated Profile object
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
};

/**
 * Upload avatar to Supabase Storage
 *
 * @param userId - User ID (used for folder structure)
 * @param file - Image file to upload
 * @returns Public URL of uploaded avatar
 */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  // Get public URL
  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Update profile with new avatar
 *
 * @param userId uuid of the user
 * @param file Image file to upload as avatar
 * @returns the updated Profile object
 */
export const updateAvatar = async (
  userId: string,
  file: File
): Promise<Profile> => {
  const avatarUrl = await uploadAvatar(userId, file);
  return updateProfile(userId, { avatar_url: avatarUrl });
};

/**
 * Delete user's avatar from storage
 *
 * @param userId uuid of the user
 */
export const deleteAvatar = async (userId: string): Promise<void> => {
  const { error } = await supabase.storage
    .from("avatars")
    .remove([`${userId}/avatar`]);
  if (error) throw new Error(error.message);

  // Remove avatar_url from profile
  await updateProfile(userId, { avatar_url: null });
};
