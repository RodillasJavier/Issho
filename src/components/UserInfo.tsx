/**
 * src/components/UserInfo.tsx
 *
 * Component for displaying username with optional avatar and link to profile.
 */
import { Link } from "react-router";
import { UserAvatar } from "./UserAvatar";

interface UserInfoProps {
  username: string;
  avatarUrl: string | null;
  showAvatar?: boolean;
  size?: "sm" | "md" | "lg";
  linkToProfile?: boolean;
}

export const UserInfo = ({
  username,
  avatarUrl,
  showAvatar = true,
  size = "sm",
  linkToProfile = true,
}: UserInfoProps) => {
  const usernameElement = (
    <span className="font-semibold text-rose-400 hover:text-rose-300 transition">
      {username}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {showAvatar && (
        <UserAvatar
          username={username}
          avatarUrl={avatarUrl}
          size={size}
          linkToProfile={linkToProfile}
        />
      )}

      {linkToProfile ? (
        <Link to={`/profile/${username}`}>{usernameElement}</Link>
      ) : (
        usernameElement
      )}
    </div>
  );
};
