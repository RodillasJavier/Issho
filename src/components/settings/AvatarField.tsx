/**
 * src/components/settings/AvatarField.tsx
 *
 * Avatar picker for the profile settings form — preview, file input behind a
 * button, and a remove control.
 */
import { useRef } from "react";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import { AVATAR_MIME_EXTENSIONS } from "../../services/supabase/profiles";
import { Button } from "../ui/Button";
import { cn, text } from "../../styles/tokens";

/** Also enforced on the bucket itself — this is the fast, friendly copy. */
const MAX_BYTES = 5 * 1024 * 1024;

interface AvatarFieldProps {
  username: string;
  /** The avatar currently shown — a preview object URL, or the saved one. */
  avatarUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onError: (message: string) => void;
  error?: string;
}

export function AvatarField({
  username,
  avatarUrl,
  onSelect,
  onRemove,
  onError,
  error,
}: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    if (!(file.type in AVATAR_MIME_EXTENSIONS)) {
      onError("Pick an image file (PNG, JPG, GIF, WebP, or AVIF).");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("That image is over 5 MB. Try a smaller one.");
      return;
    }

    onSelect(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
      <UserAvatar
        username={username}
        avatarUrl={avatarUrl}
        size="lg"
        linkToProfile={false}
      />

      <div className="w-full space-y-2 sm:w-auto">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={ImagePlusIcon}
            onClick={() => inputRef.current?.click()}
          >
            Change photo
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={Trash2Icon}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>

        <p className={error ? cn(text.error, "text-xs") : text.hint}>
          {error ??
            "Square image, at least 200×200px. PNG, JPG, GIF, WebP, or AVIF up to 5 MB."}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(AVATAR_MIME_EXTENSIONS).join(",")}
        className="sr-only"
        aria-label="Upload profile picture"
        onChange={handleChange}
      />
    </div>
  );
}
