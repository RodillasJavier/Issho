/* src/pages/SignIn.tsx */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useResendableAction } from "../hooks/useResendableAction";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthErrorBanner } from "../components/auth/AuthErrorBanner";
import { EMAIL_RE } from "../utils/authValidation";

export const SignIn = () => {
  const navigate = useNavigate();
  const { signInWithEmail, resendConfirmationEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [authError, setAuthError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    resendState,
    resend: handleResend,
    reset: resetResend,
  } = useResendableAction(async () => {
    await resendConfirmationEmail(email);
  });

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    resetResend();

    if (!validate()) return;

    setLoading(true);
    const { error } = await signInWithEmail(email, password);

    if (error) {
      setAuthError({ message: error.message, code: error.code });
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <AuthLayout title="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {authError && (
          <AuthErrorBanner
            message={authError.message}
            action={
              authError.code === "email_not_confirmed"
                ? {
                    label:
                      resendState === "sent"
                        ? "Confirmation email sent"
                        : "Resend confirmation email",
                    onClick: handleResend,
                    disabled: resendState !== "idle",
                  }
                : undefined
            }
          />
        )}

        <AuthInput
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-300">
              Password
            </span>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-rose-500 transition-colors hover:text-rose-400"
            >
              Forgot password?
            </Link>
          </div>
          <AuthInput
            label="Password"
            hideLabel
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
        </div>

        <div className="pt-3">
          <AuthButton type="submit" loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </AuthButton>
          <p className="mt-5 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-rose-500 transition-colors hover:text-rose-400"
            >
              Create one
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
