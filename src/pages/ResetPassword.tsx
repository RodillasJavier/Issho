/* src/pages/ResetPassword.tsx */
import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2Icon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthErrorBanner } from "../components/auth/AuthErrorBanner";
import { AuthStatusCard } from "../components/auth/AuthStatusCard";
import { PasswordChecklist } from "../components/auth/PasswordChecklist";
import {
  isPasswordValid,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../utils/authValidation";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!isPasswordValid(password))
      next.password = PASSWORD_REQUIREMENTS_MESSAGE;
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setFormError(error.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <AuthStatusCard
          icon={CheckCircle2Icon}
          iconVariant="green"
          action={
            <AuthButton type="button" onClick={() => navigate("/signin")}>
              Continue to sign in
            </AuthButton>
          }
        >
          <p>
            Your password has been changed. You can now sign in with your new
            password.
          </p>
        </AuthStatusCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your Issho account."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && <AuthErrorBanner message={formError} />}
        <AuthInput
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <AuthInput
          label="Confirm new password"
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
          disabled={!isPasswordValid(password) || confirm !== password}
        >
          {loading ? "Updating…" : "Update password"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
};
