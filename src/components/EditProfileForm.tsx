/**
 * src/components/EditProfileForm.tsx
 *
 * Form component for editing user profile (username, avatar, bio).
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, updateAvatar } from "../services/supabase/profiles";
import { UserAvatar } from "./UserAvatar";

interface EditProfileFormProps {
  profile: {
    username: string;
    bio: string | null;
    avatar_url: string | null;
  };
  userId: string;
}

// #region Component Logic

export const EditProfileForm = ({ profile, userId }: EditProfileFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url || null
  );

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (avatarFile) {
        await updateAvatar(userId, avatarFile);
      }

      return updateProfile(userId, { username, bio });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      navigate(`/profile/${data.username}`);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);

      // Create preview of the image before user saves & uploads to Supabase
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    updateProfileMutation.mutate();
  };

  // #endregion Component Logic

  // #region Render

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-semibold mb-6 bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        Edit Profile
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Avatar Upload */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-300">
            Profile Picture
          </label>

          <div className="flex items-center gap-4">
            <UserAvatar
              username={username}
              avatarUrl={avatarPreview}
              size="lg"
              linkToProfile={false}
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-5">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-rose-600 rounded text-sm font-semibold bg-rose-600 text-white hover:text-rose-100 hover:bg-rose-950 transition w-fit">
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

                {avatarFile && (
                  <p className="text-xs text-gray-400">{avatarFile.name}</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="username"
            className="text-sm font-semibold text-gray-300"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded text-white focus:border-rose-500 focus:outline-none"
            placeholder="Enter username"
          />
          <p className="text-xs text-gray-500">
            3-20 characters, letters, numbers, and underscores only
          </p>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className="text-sm font-semibold text-gray-300">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded text-white focus:border-rose-500 focus:outline-none resize-none"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="px-6 py-2 bg-rose-600 text-white hover:text-rose-100 border border-rose-600 rounded font-semibold hover:bg-rose-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-neutral-700 text-white rounded font-semibold hover:bg-neutral-600 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {updateProfileMutation.isError && (
          <div className="text-red-400 text-sm">
            Error updating profile. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

// #endregion Render
