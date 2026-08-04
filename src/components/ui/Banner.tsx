/**
 * src/components/ui/Banner.tsx
 *
 * Inline form-level message — errors that aren't tied to a single field,
 * confirmations, and pending states — with an optional action.
 */
import { banner, cn, radius } from "../../styles/tokens";

type BannerTone = keyof typeof banner;

interface BannerProps {
  tone?: BannerTone;
  message: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  className?: string;
}

export function Banner({
  tone = "danger",
  message,
  action,
  className,
}: BannerProps) {
  return (
    <div
      // Errors interrupt; everything else waits its turn.
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "space-y-2 border p-3",
        radius.inset,
        banner[tone],
        className
      )}
    >
      <div className="text-sm leading-6">{message}</div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className="cursor-pointer text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
