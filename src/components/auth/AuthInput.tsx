/**
 * src/components/auth/AuthInput.tsx
 *
 * Labeled text input for the auth pages, with a built-in reveal toggle for
 * password fields and inline error/hint text.
 */
import { forwardRef, useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput(
    {
      label,
      error,
      hint,
      hideLabel = false,
      type = "text",
      id,
      className,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isPassword = type === "password";
    const [reveal, setReveal] = useState(false);
    const resolvedType = isPassword ? (reveal ? "text" : "password") : type;

    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={
            hideLabel
              ? "sr-only"
              : "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-neutral-300"
          }
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
            className={[
              "w-full rounded-lg border bg-[#0c0c0f] px-3.5 py-3 text-sm text-white placeholder:text-neutral-500",
              "outline-none transition-[border-color,box-shadow] duration-200",
              "focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20",
              error
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-neutral-700",
              isPassword ? "pr-11" : "",
              className ?? "",
            ].join(" ")}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal((value) => !value)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-neutral-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {reveal ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-400">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
