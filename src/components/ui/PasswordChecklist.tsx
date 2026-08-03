/**
 * src/components/ui/PasswordChecklist.tsx
 *
 * Live password-requirements checklist shown while a user types a new
 * password (sign up, reset password, settings).
 */
import { CheckIcon, CircleIcon } from "lucide-react";
import {
  getPasswordChecks,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../../utils/authValidation";
import { cn, radius, text } from "../../styles/tokens";

interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
}

interface ChecklistItemProps {
  met: boolean;
  label: string;
  pending?: boolean;
}

export function PasswordChecklist({
  password,
  confirmPassword,
}: PasswordChecklistProps) {
  const checks = getPasswordChecks(password);
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;

  return (
    <section
      className={cn("border border-line bg-field px-4 py-3", radius.inset)}
      aria-labelledby="password-requirements"
    >
      <h2 id="password-requirements" className={text.label}>
        Password requirements
      </h2>
      <p className={cn("mt-1", text.hint)}>{PASSWORD_REQUIREMENTS_MESSAGE}</p>
      <ul className="mt-3 space-y-2" aria-live="polite">
        {checks.map((check) => (
          <ChecklistItem
            key={check.label}
            label={check.label}
            met={check.met}
          />
        ))}
        <ChecklistItem
          label="Passwords match"
          met={passwordsMatch}
          pending={!password && !confirmPassword}
        />
      </ul>
    </section>
  );
}

function ChecklistItem({ met, label, pending = false }: ChecklistItemProps) {
  const itemColor = met
    ? "text-success"
    : pending
      ? "text-content-subtle"
      : "text-content-muted";

  return (
    <li className={cn("flex items-center gap-2 text-xs", itemColor)}>
      {met ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckIcon className="h-3 w-3" strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <CircleIcon
          className="h-4 w-4 shrink-0 text-content-faint"
          aria-hidden
        />
      )}
      <span>{label}</span>
    </li>
  );
}
