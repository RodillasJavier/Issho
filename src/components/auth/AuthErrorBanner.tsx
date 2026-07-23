/**
 * src/components/auth/AuthErrorBanner.tsx
 *
 * Inline banner for auth errors that aren't tied to a single form field
 * (e.g. invalid credentials, unconfirmed email), with an optional action.
 */
interface AuthErrorBannerProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export function AuthErrorBanner({ message, action }: AuthErrorBannerProps) {
  return (
    <div className="space-y-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3">
      <p className="text-sm text-red-200">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className="cursor-pointer text-sm font-medium text-rose-300 transition-colors hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
