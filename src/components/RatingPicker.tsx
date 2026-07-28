/**
 * src/components/RatingPicker.tsx
 *
 * The 1–10 rating control: a conic-gradient score dial beside a grid of ten
 * buttons. Shared by the Create composer and the list edit modal.
 */
// #region Types
interface RatingPickerProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  /** Copy beside the dial, explaining that a rating is optional. */
  hint: string;
  /** Matches the surface the dial sits on, so its centre reads as a hole. */
  dialBackgroundClass?: string;
  disabled?: boolean;
}
// #endregion Types

const RATINGS = Array.from({ length: 10 }, (_, index) => index + 1);

// #region Render
export const RatingPicker = ({
  value,
  onChange,
  hint,
  dialBackgroundClass = "bg-[#0c0c0f]",
  disabled = false,
}: RatingPickerProps) => (
  <>
    <div className="flex items-center gap-4">
      <div
        aria-hidden
        className="grid size-24 shrink-0 place-items-center rounded-full p-[5px] shadow-[0_0_28px_rgba(244,63,94,0.14)]"
        style={{
          background: `conic-gradient(#f43f5e 0deg ${(value ?? 0) * 36}deg, #27272a ${(value ?? 0) * 36}deg 360deg)`,
        }}
      >
        <div
          className={`grid size-full place-items-center rounded-full ${dialBackgroundClass}`}
        >
          <p className="font-mono text-2xl font-semibold text-rose-400">
            {value ?? "—"}
            <span className="ml-0.5 text-sm text-zinc-500">/10</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>

    <div className="mt-4 grid grid-cols-5 gap-2">
      {RATINGS.map((rating) => {
        const active = value === rating;
        return (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${rating} out of 10`}
            aria-pressed={active}
            onClick={() => onChange(active ? null : rating)}
            className={`cursor-pointer rounded-md border py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-rose-400/60 bg-rose-400/10 text-rose-200"
                : "border-zinc-800 bg-[#101014] text-zinc-300 hover:border-zinc-700"
            }`}
          >
            {rating}
          </button>
        );
      })}
    </div>
  </>
);
// #endregion Render
