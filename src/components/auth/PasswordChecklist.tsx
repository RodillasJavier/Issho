/**
 * src/components/auth/PasswordChecklist.tsx
 *
 * Live password-requirements checklist shown while a user types a new
 * password (sign up, reset password).
 */
import { CheckIcon, CircleIcon } from "lucide-react";
import {
  getPasswordChecks,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../../utils/authValidation";

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
      className="rounded-lg border border-neutral-800 bg-[#101014] px-4 py-3"
      aria-labelledby="password-requirements"
    >
      <h2
        id="password-requirements"
        className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-300"
      >
        Password requirements
      </h2>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        {PASSWORD_REQUIREMENTS_MESSAGE}
      </p>
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
    ? "text-green-400"
    : pending
      ? "text-neutral-500"
      : "text-neutral-400";

  return (
    <li className={`flex items-center gap-2 text-xs ${itemColor}`}>
      {met ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <CheckIcon className="h-3 w-3" strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <CircleIcon className="h-4 w-4 shrink-0 text-neutral-600" aria-hidden />
      )}
      <span>{label}</span>
    </li>
  );
}
