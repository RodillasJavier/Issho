/**
 * src/components/ui/Button.tsx
 *
 * The app's button primitive. Every axis a caller might want to change is a
 * prop — `className` is additive only (see src/styles/tokens.ts).
 */
import { Loader2Icon, type LucideIcon } from "lucide-react";
import { cn, control } from "../../styles/tokens";

type ButtonVariant = keyof typeof control.variant;
type ButtonSize = keyof typeof control.size;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: "leading" | "trailing";
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = "leading",
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  // The spinner takes the icon's place rather than sitting beside it, so the
  // button's width doesn't jump when a submit starts.
  const glyph = loading ? (
    <Loader2Icon className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
  ) : Icon ? (
    <Icon className="h-4 w-4 shrink-0" aria-hidden />
  ) : null;

  return (
    <button
      className={cn(
        control.base,
        control.size[size],
        control.variant[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {iconPosition === "leading" && glyph}
      {children}
      {iconPosition === "trailing" && glyph}
    </button>
  );
}
