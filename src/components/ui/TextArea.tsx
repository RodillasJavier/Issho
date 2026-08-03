/**
 * src/components/ui/TextArea.tsx
 *
 * Labeled multi-line input with an optional live character counter.
 * `className` is additive only (see src/styles/tokens.ts).
 */
import { forwardRef, useId } from "react";
import { cn, control, text } from "../../styles/tokens";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  /** Requires a controlled `value` — the counter reads its length. */
  showCounter?: boolean;
  /** Characters remaining at which the counter turns amber. */
  counterWarnAt?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      error,
      hint,
      hideLabel = false,
      showCounter = false,
      counterWarnAt = 25,
      maxLength,
      value,
      id,
      className,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const length = String(value ?? "").length;
    const withCounter = showCounter && maxLength !== undefined;
    const remaining = withCounter ? maxLength - length : 0;

    const describedBy = error
      ? `${fieldId}-error`
      : hint
        ? `${fieldId}-hint`
        : withCounter
          ? `${fieldId}-count`
          : undefined;

    return (
      <div className={cn("w-full", className)}>
        <label
          htmlFor={fieldId}
          className={hideLabel ? "sr-only" : cn("mb-2 block", text.label)}
        >
          {label}
        </label>

        <textarea
          ref={ref}
          id={fieldId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            control.field,
            error ? control.fieldError : control.fieldIdle,
            "min-h-[120px] resize-y leading-6"
          )}
          {...props}
        />

        <div className="mt-1.5 flex items-start justify-between gap-3">
          {error ? (
            <p id={`${fieldId}-error`} className={text.error}>
              {error}
            </p>
          ) : hint ? (
            <p id={`${fieldId}-hint`} className={text.hint}>
              {hint}
            </p>
          ) : (
            <span />
          )}

          {withCounter && (
            <p
              id={`${fieldId}-count`}
              aria-live="polite"
              className={cn(
                text.hint,
                "shrink-0",
                remaining <= counterWarnAt && "text-warning"
              )}
            >
              {length}/{maxLength} characters
            </p>
          )}
        </div>
      </div>
    );
  }
);
