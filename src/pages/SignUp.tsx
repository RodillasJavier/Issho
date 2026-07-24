/* src/pages/SignUp.tsx */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MailCheckIcon, ArrowLeftIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResendableAction } from "../hooks/useResendableAction";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthErrorBanner } from "../components/auth/AuthErrorBanner";
import { AuthStatusCard } from "../components/auth/AuthStatusCard";
import { PasswordChecklist } from "../components/auth/PasswordChecklist";
import {
  EMAIL_RE,
  isPasswordValid,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../utils/authValidation";

export const SignUp = () => {
  const navigate = useNavigate();
  const { signUpWithEmail, resendConfirmationEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendError, setResendError] = useState("");

  const { resendState, resend: handleResend } = useResendableAction(
    async () => {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        setResendError(error.message);
        return false;
      }
      setResendError("");
      return true;
    }
  );

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!isPasswordValid(password))
      next.password = PASSWORD_REQUIREMENTS_MESSAGE;
    if (!confirm) next.confirm = "Confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await signUpWithEmail(email, password);

    if (error) {
      setFormError(error.message);
      setLoading(false);
    } else if (data.session) {
      navigate("/");
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Confirm your email">
        <AuthStatusCard
          icon={MailCheckIcon}
          action={
            <>
              <AuthButton
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={resendState !== "idle"}
              >
                {resendState === "sent"
                  ? "Confirmation email sent"
                  : "Resend confirmation email"}
              </AuthButton>
              {resendError && (
                <p className="text-sm text-red-400">{resendError}</p>
              )}
            </>
          }
          footer={
            <Link
              to="/signin"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-400"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Back to sign in
            </Link>
          }
        >
          <p>
            We sent a confirmation link to{" "}
            <span className="font-semibold text-white">{email}</span>.
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Click the link in that email to activate your account. Be sure to
            check your spam folder if you don&apos;t see it.
          </p>
        </AuthStatusCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-rose-500 hover:text-rose-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && <AuthErrorBanner message={formError} />}

        <AuthInput
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <PasswordChecklist password={password} confirmPassword={confirm} />
        <AuthButton
          type="submit"
          loading={loading}
          disabled={
            !EMAIL_RE.test(email) ||
            !isPasswordValid(password) ||
            confirm !== password
          }
        >
          {loading ? "Creating account…" : "Sign up"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
};
