/**
 * src/components/settings/ProfileSection.tsx
 *
 * The public half of a user's settings — avatar, username, bio.
 */
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  isUsernameAvailable,
  PartialProfileSaveError,
  profileQueryKey,
  saveProfile,
  UsernameInvalidError,
  UsernameTakenError,
} from "../../services/supabase/profiles";
import { entriesQueryKey } from "../../services/supabase/entries";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Profile } from "../../types/database.types";
import { AvatarField } from "./AvatarField";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Banner } from "../ui/Banner";
import { TextField } from "../ui/TextField";
import { TextArea } from "../ui/TextArea";
import { cn, text } from "../../styles/tokens";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const BIO_MAX = 500;

// A single tag for the one avatar decision being made, rather than a picked
// file and a remove flag that only stay mutually exclusive by convention.
type AvatarChoice =
  | { kind: "unchanged" }
  | { kind: "picked"; file: File; url: string }
  | { kind: "removed" };

interface ProfileSectionProps {
  profile: Profile;
  userId: string;
}

export function ProfileSection({ profile, userId }: ProfileSectionProps) {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarChoice, setAvatarChoice] = useState<AvatarChoice>({
    kind: "unchanged",
  });
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [formError, setFormError] = useState("");

  // An object URL lives until it's revoked, so every pick has to release the
  // one before it. The ref is what lets the unmount cleanup below reach the
  // current URL without re-running on every change.
  const pickedUrlRef = useRef<string | null>(null);

  const pickAvatar = (file: File | null) => {
    if (pickedUrlRef.current) URL.revokeObjectURL(pickedUrlRef.current);
    if (!file) {
      pickedUrlRef.current = null;
      setAvatarChoice({ kind: "unchanged" });
      return;
    }
    const url = URL.createObjectURL(file);
    pickedUrlRef.current = url;
    setAvatarChoice({ kind: "picked", file, url });
  };

  const markAvatarRemoved = () => {
    if (pickedUrlRef.current) URL.revokeObjectURL(pickedUrlRef.current);
    pickedUrlRef.current = null;
    // Only a saved avatar needs deleting; dropping an unsaved pick is just
    // discarding the pending file.
    setAvatarChoice(
      profile.avatar_url ? { kind: "removed" } : { kind: "unchanged" }
    );
  };

  useEffect(
    () => () => {
      if (pickedUrlRef.current) URL.revokeObjectURL(pickedUrlRef.current);
    },
    []
  );

  const avatarFile = avatarChoice.kind === "picked" ? avatarChoice.file : null;
  const removeAvatar = avatarChoice.kind === "removed";
  const shownAvatarUrl =
    avatarChoice.kind === "removed"
      ? null
      : avatarChoice.kind === "picked"
        ? avatarChoice.url
        : profile.avatar_url;

  const isDirty =
    username !== profile.username ||
    bio !== (profile.bio ?? "") ||
    avatarChoice.kind !== "unchanged";

  const debouncedUsername = useDebouncedValue(username, 400);
  const shouldCheckUsername =
    debouncedUsername !== profile.username &&
    USERNAME_RE.test(debouncedUsername);

  const availability = useQuery({
    queryKey: ["usernameAvailable", debouncedUsername],
    queryFn: () => isUsernameAvailable(debouncedUsername, userId),
    enabled: shouldCheckUsername,
    staleTime: 30_000,
  });

  const usernameMalformed =
    username !== profile.username ? !USERNAME_RE.test(username) : false;
  const usernameTaken = shouldCheckUsername && availability.data === false;

  const liveUsernameError = usernameError
    ? usernameError
    : usernameMalformed
      ? "3–20 characters, letters, numbers, and underscores only."
      : usernameTaken
        ? "That username is already taken."
        : undefined;

  // The same row is cached under both the id and the username, and a rename
  // orphans the old username key — invalidate the whole prefix rather than
  // trying to name every shape. The activity feed joins author name and
  // avatar in memory, so it holds its own stale copy of whatever just changed.
  const syncProfileCaches = (updated: Profile) => {
    queryClient.setQueryData(profileQueryKey(userId), updated);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: entriesQueryKey(userId) });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      saveProfile(userId, profile, { username, bio, avatarFile, removeAvatar }),
    onSuccess: (updated) => {
      syncProfileCaches(updated);
      pickAvatar(null);
    },
    onError: (error) => {
      if (
        error instanceof UsernameTakenError ||
        error instanceof UsernameInvalidError
      ) {
        setUsernameError(error.message);
        return;
      }
      // The username/bio half already committed — reflect that in the cache
      // even though the avatar half is about to show as a failure below.
      if (error instanceof PartialProfileSaveError) {
        syncProfileCaches(error.profile);
      }
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not save your profile. Try again."
      );
    },
  });

  const discard = () => {
    setUsername(profile.username);
    setBio(profile.bio ?? "");
    pickAvatar(null);
    setAvatarError(undefined);
    setUsernameError(undefined);
    setFormError("");
    // Otherwise a save-then-edit-then-discard sequence would leave isSuccess
    // true, and the "Profile updated" banner would reappear once isDirty
    // drops back to false, even though nothing was actually just saved.
    saveMutation.reset();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setUsernameError(undefined);
    setFormError("");
    if (usernameMalformed || usernameTaken) return;
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card
        title="Public profile"
        description="This is what your circle sees on your entries and watchlist."
        stickyFooterOnMobile
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={discard}
              disabled={!isDirty || saveMutation.isPending}
            >
              Discard
            </Button>
            <Button
              type="submit"
              loading={saveMutation.isPending}
              disabled={!isDirty || usernameMalformed || usernameTaken}
            >
              {saveMutation.isPending ? "Saving" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {formError && <Banner message={formError} />}
          {saveMutation.isSuccess && !isDirty && (
            <Banner tone="success" message="Profile updated." />
          )}

          <AvatarField
            username={username || profile.username}
            avatarUrl={shownAvatarUrl}
            error={avatarError}
            onError={setAvatarError}
            onSelect={(file) => {
              setAvatarError(undefined);
              pickAvatar(file);
            }}
            onRemove={() => {
              setAvatarError(undefined);
              markAvatarRemoved();
            }}
          />

          <div className="grid gap-5">
            <TextField
              label="Username"
              value={username}
              autoComplete="username"
              onChange={(event) => {
                setUsername(event.target.value);
                setUsernameError(undefined);
              }}
              error={liveUsernameError}
              hint="3–20 characters, letters, numbers, and underscores only."
              trailingAdornment={
                shouldCheckUsername ? (
                  availability.isFetching ? (
                    <Loader2Icon
                      className="h-4 w-4 animate-spin text-content-subtle"
                      aria-hidden
                    />
                  ) : availability.data === true ? (
                    <CheckIcon className="h-4 w-4 text-success" aria-hidden />
                  ) : availability.data === false ? (
                    <XIcon className="h-4 w-4 text-danger" aria-hidden />
                  ) : null
                ) : null
              }
            />

            <TextArea
              label="Bio"
              value={bio}
              maxLength={BIO_MAX}
              showCounter
              placeholder="Tell your circle what you're watching."
              onChange={(event) => setBio(event.target.value)}
            />
          </div>

          <p className={cn(text.hint, "flex flex-wrap items-center gap-x-2")}>
            <span className={text.eyebrow}>Profile URL</span>
            <span className="break-all">
              https://www.issho.live/profile/{username || profile.username}
            </span>
          </p>
        </div>
      </Card>
    </form>
  );
}
