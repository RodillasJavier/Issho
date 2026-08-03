/**
 * src/components/ui/PasswordStrengthMeter.tsx
 *
 * Segmented strength bar over the same rules as PasswordChecklist — the
 * at-a-glance summary, with the checklist below it as the detail. Both read
 * from getPasswordChecks so the two can't disagree.
 */
import { getPasswordChecks } from "../../utils/authValidation";
import { cn, text } from "../../styles/tokens";

/** Indexed by met-check count, so index 0 is the empty-password case. */
const STRENGTH_LABELS = [
  "Too weak",
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
] as const;

const STRENGTH_COLORS = [
  "bg-line",
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-warning",
  "bg-success",
] as const;

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const checks = getPasswordChecks(password);
  const score = checks.filter((check) => check.met).length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
        {checks.map((check, index) => (
          <span
            key={check.label}
            className={cn(
              "h-full flex-1 rounded-full transition-colors",
              index < score ? STRENGTH_COLORS[score] : "bg-line"
            )}
          />
        ))}
      </div>
      <span className={cn(text.hint, "shrink-0")} aria-live="polite">
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}
