/**
 * src/components/auth/AuthButton.tsx
 *
 * Primary/ghost submit button for the auth pages, with a built-in loading
 * spinner state.
 */
import { Loader2Icon } from "lucide-react";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost";
}

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60";
const variants = {
  primary:
    "bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-400",
  ghost:
    "border border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900 focus-visible:ring-rose-500",
};

export function AuthButton({
  loading = false,
  variant = "primary",
  children,
  disabled,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={[base, variants[variant], className ?? ""].join(" ")}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
