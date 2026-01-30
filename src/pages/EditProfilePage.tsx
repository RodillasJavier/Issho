/**
 * src/pages/EditProfilePage.tsx
 *
 * Page for users to edit their profile (username, avatar, bio).
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getProfileById } from "../services/supabase/profiles";
import { EditProfileForm } from "../components/EditProfileForm";

export const EditProfilePage = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: !!user?.id,
  });

  if (!user) {
    return <div>Please sign in to edit your profile</div>;
  }

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <EditProfileForm key={profile.id} profile={profile} userId={user.id} />
  );
};
