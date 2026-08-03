/**
 * src/components/ui/TextField.tsx
 *
 * Labeled text input with a built-in reveal toggle for password fields and
 * inline error/hint text. `className` is additive only (see
 * src/styles/tokens.ts).
 */
import { forwardRef, useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn, control, focusRing, text } from "../../styles/tokens";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  /** Defaults to true for `type="password"`. */
  revealable?: boolean;
  /**
   * Content for the input's trailing slot — e.g. a username-availability
   * spinner. The reveal toggle shares that slot and wins when both apply, so
   * don't pair an adornment with a revealable password field.
   */
  trailingAdornment?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      error,
      hint,
      hideLabel = false,
      revealable,
      trailingAdornment,
      type = "text",
      id,
      className,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const canReveal = revealable ?? type === "password";
    const [reveal, setReveal] = useState(false);
    const resolvedType = canReveal ? (reveal ? "text" : "password") : type;
    const hasTrailing = canReveal || Boolean(trailingAdornment);

    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    return (
      <div className={cn("w-full", className)}>
        <label
          htmlFor={inputId}
          className={hideLabel ? "sr-only" : cn("mb-2 block", text.label)}
        >
          {label}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              control.field,
              error ? control.fieldError : control.fieldIdle,
              hasTrailing && "pr-11"
            )}
            {...props}
          />

          {canReveal ? (
            <button
              type="button"
              onClick={() => setReveal((value) => !value)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5",
                "text-content-muted transition-colors duration-200 hover:text-content",
                focusRing
              )}
            >
              {reveal ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          ) : trailingAdornment ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {trailingAdornment}
            </span>
          ) : null}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className={cn("mt-1.5", text.error)}>
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className={cn("mt-1.5", text.hint)}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
