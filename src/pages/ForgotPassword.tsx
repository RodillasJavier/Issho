/* src/pages/ForgotPassword.tsx */
import { useState } from "react";
import { Link } from "react-router";
import { MailCheckIcon, ArrowLeftIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResendableAction } from "../hooks/useResendableAction";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthErrorBanner } from "../components/auth/AuthErrorBanner";
import { AuthStatusCard } from "../components/auth/AuthStatusCard";
import { EMAIL_RE } from "../utils/authValidation";

export const ForgotPassword = () => {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const { error } = await resetPasswordForEmail(email);
    if (error) {
      setFormError(error.message);
      return false;
    }
    return true;
  };

  const { resendState, resend: handleResend } =
    useResendableAction(sendResetLink);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!EMAIL_RE.test(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError(undefined);

    setLoading(true);
    const ok = await sendResetLink();
    setLoading(false);
    if (ok) setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <AuthStatusCard
          icon={MailCheckIcon}
          action={
            <AuthButton
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendState !== "idle"}
            >
              {resendState === "sent" ? "Reset link sent" : "Resend reset link"}
            </AuthButton>
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
            If an account exists for{" "}
            <span className="font-semibold text-white">{email}</span>,
            we&apos;ve sent a link to reset your password.
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            The link expires in 60 minutes. Check your spam folder if it
            doesn&apos;t arrive.
          </p>
        </AuthStatusCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email tied to your account and we'll send you a link to set a new password."
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
          error={fieldError}
        />
        <AuthButton type="submit" loading={loading}>
          {loading ? "Sending link…" : "Send reset link"}
        </AuthButton>
        <Link
          to="/signin"
          className="mt-2 flex items-center justify-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
};
