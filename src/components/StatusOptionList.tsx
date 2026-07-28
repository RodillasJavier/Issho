/**
 * src/components/StatusOptionList.tsx
 *
 * The "where are you?" status picker: a radiogroup of full-width option rows.
 * Shared by the Create composer and the list edit modal so the two stay
 * identical rather than merely similar.
 */
import { STATUS_OPTIONS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface StatusOptionListProps {
  value: AnimeStatus | null;
  onChange: (status: AnimeStatus | null) => void;
  /**
   * Whether clicking the selected option clears it. The composer allows
   * publishing without a status; a list entry always has one.
   */
  clearable?: boolean;
  disabled?: boolean;
}
// #endregion Types

// #region Render
export const StatusOptionList = ({
  value,
  onChange,
  clearable = false,
  disabled = false,
}: StatusOptionListProps) => (
  <div role="radiogroup" aria-label="Watch status" className="space-y-2">
    {STATUS_OPTIONS.map((option) => {
      const active = value === option.value;
      const Icon = option.icon;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          disabled={disabled}
          onClick={() => onChange(active && clearable ? null : option.value)}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            active
              ? "border-rose-400/60 bg-rose-400/10"
              : "border-zinc-800 bg-[#101014] hover:border-zinc-700"
          }`}
        >
          <Icon
            aria-hidden
            className={`size-5 shrink-0 ${active ? "text-rose-300" : "text-zinc-500"}`}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-zinc-100">
              {option.label}
            </span>
            <span className="block text-xs text-zinc-500">
              {option.subtitle}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);
// #endregion Render
