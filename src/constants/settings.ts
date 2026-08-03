/**
 * src/constants/settings.ts
 *
 * The sections of the settings page, and their nav copy.
 */
import { MailIcon, ShieldIcon, UserIcon, type LucideIcon } from "lucide-react";

export type SettingsSectionId = "profile" | "account" | "security";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile",
    description: "How you show up across Issho",
    icon: UserIcon,
  },
  {
    id: "account",
    label: "Account",
    description: "Email and account details",
    icon: MailIcon,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and sign-in",
    icon: ShieldIcon,
  },
];

export const isSettingsSectionId = (
  value: string | null
): value is SettingsSectionId =>
  SETTINGS_SECTIONS.some((section) => section.id === value);
