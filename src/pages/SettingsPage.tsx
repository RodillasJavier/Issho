/**
 * src/pages/SettingsPage.tsx
 *
 * Account settings — profile, email, and password — in one place.
 */
import { Navigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { getProfileById, profileQueryKey } from "../services/supabase/profiles";
import {
  isSettingsSectionId,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "../constants/settings";
import { SettingsNav } from "../components/settings/SettingsNav";
import { ProfileSection } from "../components/settings/ProfileSection";
import { AccountSection } from "../components/settings/AccountSection";
import { SecuritySection } from "../components/settings/SecuritySection";
import { Banner } from "../components/ui/Banner";
import { cn, page, surface, text } from "../styles/tokens";

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const SettingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user),
  });

  if (!user) return <Navigate to="/signin" replace />;

  // The tab lives in the URL so the email-confirmation link can land straight
  // on ?tab=account. `replace` keeps Back leaving settings rather than
  // walking the tabs the user clicked through.
  const tabParam = searchParams.get("tab");
  const active: SettingsSectionId = isSettingsSectionId(tabParam)
    ? tabParam
    : "profile";
  const setActive = (id: SettingsSectionId) =>
    setSearchParams({ tab: id }, { replace: true });

  let content: React.ReactNode;
  if (isLoading) {
    content = <SettingsSkeleton />;
  } else if (isError) {
    content = (
      <Banner
        message={
          error instanceof Error
            ? error.message
            : "Could not load your profile."
        }
      />
    );
  } else if (!profile) {
    content = <Banner message="We couldn't find a profile for this account." />;
  } else if (active === "profile") {
    content = <ProfileSection profile={profile} userId={user.id} />;
  } else if (active === "account") {
    content = <AccountSection user={user} profile={profile} />;
  } else {
    content = <SecuritySection user={user} />;
  }

  // SETTINGS_SECTIONS has an entry for every SettingsSectionId, so this can
  // never fall through to undefined.
  const activeSection = SETTINGS_SECTIONS.find(
    (section) => section.id === active
  )!;

  return (
    <div className={page.shell}>
      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsNav
          sections={SETTINGS_SECTIONS}
          active={active}
          onChange={setActive}
        />

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        >
          <p className={cn(text.body, "mb-4 lg:hidden")}>
            {activeSection.description}
          </p>

          {content}
        </motion.div>
      </div>
    </div>
  );
};

function SettingsSkeleton() {
  return (
    <div className={cn(surface.card, "animate-pulse")} aria-hidden>
      <div className={surface.cardHeader}>
        <div className="h-4 w-40 rounded bg-line" />
        <div className="mt-2 h-3 w-64 rounded bg-line-subtle" />
      </div>
      <div className={cn(surface.cardBody, "space-y-4")}>
        <div className="h-24 w-24 rounded-full bg-line" />
        <div className="h-10 w-full rounded-lg bg-line-subtle" />
        <div className="h-28 w-full rounded-lg bg-line-subtle" />
      </div>
    </div>
  );
}
