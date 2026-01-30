/**
 * src/components/UserAvatar.tsx
 *
 * Component for displaying a user's avatar (profile picture) with fallback.
 */
import { Link } from "react-router";

// #region Types & Constants

interface UserAvatarProps {
  username: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  linkToProfile?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

// #endregion Types & Constants

// #region Component Logic
export const UserAvatar = ({
  username,
  avatarUrl,
  size = "md",
  linkToProfile = true,
}: UserAvatarProps) => {
  if (!username) return null;

  const initial = username[0].toUpperCase();
  const sizeClass = sizeClasses[size];

  const avatarElement = (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-400 to-rose-600 flex-shrink-0`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-semibold text-white">{initial}</span>
      )}
    </div>
  );

  // #endregion Component Logic

  // #region Render

  if (linkToProfile) {
    return (
      <Link to={`/user/${username}`} className="hover:opacity-80 transition">
        {avatarElement}
      </Link>
    );
  }

  return avatarElement;
};

// #endregion Render
