/**
 * src/services/supabase/profiles.ts
 *
 * API functions for managing user profiles.
 */
import supabase from "../../supabase-client";
import type { Profile, ProfileUpdate } from "../../types/database.types";

/**
 * Thrown when a username is already held by another account. The `profiles`
 * unique constraint is the real enforcement — the availability check below is
 * only a convenience, since another account can claim the name between the
 * check and the write.
 */
export class UsernameTakenError extends Error {
  constructor(message = "That username is already taken.") {
    super(message);
    this.name = "UsernameTakenError";
  }
}

/** Thrown when a username violates the length or character-set constraint. */
export class UsernameInvalidError extends Error {
  constructor(
    message = "Usernames are 3–20 characters, letters, numbers, and underscores only."
  ) {
    super(message);
    this.name = "UsernameInvalidError";
  }
}

/**
 * Thrown when the username/bio half of a save already committed but the
 * avatar half then failed — carries the profile as it now stands in
 * Postgres, so the caller can reconcile its cache instead of showing a
 * failure banner over stale data.
 */
export class PartialProfileSaveError extends Error {
  constructor(
    message: string,
    public readonly profile: Profile
  ) {
    super(message);
    this.name = "PartialProfileSaveError";
  }
}

/**
 * Query key for a profile fetched by id. Centralized so every reader
 * (`Navbar`, `EntryList`, `SettingsPage`) and every writer that patches the
 * cache after a save agree on the same shape.
 */
export const profileQueryKey = (userId: string | undefined) =>
  ["profile", userId] as const;

const AVATAR_BUCKET = "avatars";

/**
 * Also the set of MIME types the `avatars` bucket accepts (see
 * `allowed_mime_types` in `20260802185750_restrict_avatar_uploads_to_own_folder.sql`) —
 * AvatarField validates against these same keys so a rejected type never
 * reaches the upload call.
 */
export const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

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
 * Check whether a username is free for a given user to take.
 *
 * Matches with `.eq`, not `.ilike`, because `profiles_username_key` is a plain
 * case-sensitive UNIQUE — a case-insensitive check here would report names as
 * taken that the database would happily accept.
 *
 * @param username the username to test
 * @param currentUserId uuid of the user asking (their own name counts as free)
 * @returns true if no other account holds the name
 */
export const isUsernameAvailable = async (
  username: string,
  currentUserId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !data || data.id === currentUserId;
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

  if (error) {
    // Translate the two constraint violations a user can actually cause into
    // something a form can show against the right field. Both the username
    // format and length checks report 23514, and one message covers them.
    if (error.code === "23505") throw new UsernameTakenError();
    if (error.code === "23514") throw new UsernameInvalidError();
    throw new Error(error.message);
  }
  return data as Profile;
};

/**
 * Upload an avatar to Supabase Storage.
 *
 * The object name is content-addressed (a fresh uuid per upload) rather than a
 * fixed `avatar.{ext}`. A stable name meant every re-upload reused the same
 * public URL, so browsers and the CDN kept serving the previous image. A new
 * path sidesteps caching entirely and lets the object be cached hard.
 *
 * Older profiles still point at the legacy `{userId}/avatar.{ext}` name, which
 * continues to resolve — always read `avatar_url` from the database rather
 * than reconstructing a path.
 *
 * @param userId - User ID (used for folder structure)
 * @param file - Image file to upload
 * @returns the object's storage name and its public URL
 */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<{ fileName: string; publicUrl: string }> => {
  // `split(".").pop()` on a dotless filename returns the whole filename, so
  // only trust it when there is actually an extension to take.
  const nameParts = file.name.split(".");
  const ext =
    nameParts.length > 1
      ? nameParts.pop()!.toLowerCase()
      : (AVATAR_MIME_EXTENSIONS[file.type] ?? "png");

  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "31536000",
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { fileName, publicUrl: data.publicUrl };
};

/**
 * Delete every object in a user's avatar folder, optionally sparing one.
 *
 * Lists the folder rather than assuming a filename, so it cleans up both the
 * legacy `avatar.{ext}` object and any uuid-named ones.
 *
 * @param userId uuid of the user (their storage folder)
 * @param keep name of an object to leave in place, if any
 */
const LIST_PAGE_SIZE = 100;

const removeAvatarObjects = async (
  userId: string,
  keep?: string
): Promise<void> => {
  const names: string[] = [];
  // .list() defaults to a 100-object page, so a folder that has accumulated
  // more stale objects than that needs to be paged through explicitly.
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data: page, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId, { limit: LIST_PAGE_SIZE, offset });
    if (listError) throw new Error(listError.message);

    names.push(...(page ?? []).map((file) => file.name));
    if (!page || page.length < LIST_PAGE_SIZE) break;
  }

  const stale = names
    .filter((name) => name !== keep)
    .map((name) => `${userId}/${name}`);
  if (stale.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove(stale);
  if (removeError) throw new Error(removeError.message);
};

/**
 * Delete the user's avatar from storage and clear it on their profile.
 *
 * @param userId uuid of the user
 */
export const deleteAvatar = async (userId: string): Promise<void> => {
  await removeAvatarObjects(userId);
  await updateProfile(userId, { avatar_url: null });
};

export interface ProfileDraft {
  username: string;
  bio: string;
  /** A newly picked image to upload. Ignored when `removeAvatar` is set. */
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

/**
 * Save every editable part of a profile in one call.
 *
 * Order matters: the username/bio update runs *first* because it is the write
 * that can be rejected (a taken username, a failed constraint). Uploading the
 * avatar first — as this used to — meant a rejected username still left the
 * new image persisted, so a failed save partly succeeded. It's skipped
 * entirely when neither field actually changed, so an avatar-only save
 * doesn't re-write an unchanged username through the unique-constraint check.
 *
 * The remaining window is small and benign: if the upload succeeds but writing
 * `avatar_url` fails, an unreferenced object is left behind, and the next
 * avatar change prunes it. Closing that window entirely would need a
 * transaction spanning Postgres and Storage, which is only reachable from an
 * edge function.
 *
 * If the username/bio write commits but the avatar half then throws, the
 * error is re-thrown as `PartialProfileSaveError` carrying that committed
 * profile, so the caller can still reconcile its cache with what actually
 * landed in Postgres instead of treating the whole save as a no-op.
 *
 * @param userId uuid of the user
 * @param current the profile as currently cached, used to skip an unchanged
 *   username/bio write and as the base for a partial-failure result
 * @param draft the full set of profile fields as edited
 * @returns the saved Profile object
 */
export const saveProfile = async (
  userId: string,
  current: Profile,
  { username, bio, avatarFile, removeAvatar }: ProfileDraft
): Promise<Profile> => {
  const fieldsChanged =
    username !== current.username || bio !== (current.bio ?? "");
  const profile = fieldsChanged
    ? await updateProfile(userId, { username, bio })
    : current;

  try {
    if (removeAvatar) {
      await deleteAvatar(userId);
      return { ...profile, avatar_url: null };
    }

    if (avatarFile) {
      const { fileName, publicUrl } = await uploadAvatar(userId, avatarFile);
      const updated = await updateProfile(userId, { avatar_url: publicUrl });

      // A leftover object isn't worth failing an otherwise successful save over.
      try {
        await removeAvatarObjects(userId, fileName);
      } catch (error) {
        console.warn("Could not prune old avatar objects", error);
      }

      return updated;
    }
  } catch (error) {
    if (fieldsChanged) {
      throw new PartialProfileSaveError(
        error instanceof Error
          ? error.message
          : "Your username and bio saved, but the avatar didn't.",
        profile
      );
    }
    throw error;
  }

  return profile;
};
