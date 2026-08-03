/**
 * src/components/settings/SettingsNav.tsx
 *
 * Section switcher for the settings page — a scrolling pill row on small
 * screens, a sticky sidebar list from `lg` up.
 */
import type {
  SettingsSection,
  SettingsSectionId,
} from "../../constants/settings";
import { cn, focusRing, radius, text } from "../../styles/tokens";

interface SettingsNavProps {
  sections: SettingsSection[];
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
}

export function SettingsNav({ sections, active, onChange }: SettingsNavProps) {
  return (
    // `top-24` clears AppShell's fixed navbar and its pt-20 offset.
    <nav aria-label="Settings sections" className="lg:sticky lg:top-24">
      <p className={cn(text.eyebrow, "mb-3 hidden px-3 lg:block")}>Settings</p>

      <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active;

          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 whitespace-nowrap border px-4 py-2 text-left transition-colors",
                  "lg:gap-3 lg:px-3 lg:py-2.5",
                  radius.pill,
                  "lg:rounded-lg",
                  focusRing,
                  isActive
                    ? "border-line-strong bg-surface text-content"
                    : "border-line text-content-muted hover:bg-surface hover:text-content"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-accent-line" : "text-content-subtle"
                  )}
                  aria-hidden
                />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
