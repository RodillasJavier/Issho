/**
 * src/utils/authValidation.ts
 *
 * Shared validation rules for the auth pages (sign up, sign in, password
 * reset) — a single source of truth for the email format check and the
 * password-strength checklist so the rule can't drift between the field
 * validator and the live checklist UI.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72;
const LOWERCASE_RE = /[a-z]/;
const UPPERCASE_RE = /[A-Z]/;
const NUMBER_RE = /\d/;
const SYMBOL_RE = /[^A-Za-z0-9]/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use 6–72 characters with uppercase, lowercase, a number, and a symbol.";

export interface PasswordCheck {
  label: string;
  met: boolean;
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      label: "Between 6 and 72 characters",
      met:
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      label: "At least one lowercase letter",
      met: LOWERCASE_RE.test(password),
    },
    {
      label: "At least one uppercase letter",
      met: UPPERCASE_RE.test(password),
    },
    { label: "At least one number", met: NUMBER_RE.test(password) },
    { label: "At least one symbol", met: SYMBOL_RE.test(password) },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordChecks(password).every((check) => check.met);
}
