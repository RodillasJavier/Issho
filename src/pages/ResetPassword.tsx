/* src/pages/ResetPassword.tsx */
import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2Icon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthStatusCard } from "../components/auth/AuthStatusCard";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Banner } from "../components/ui/Banner";
import { PasswordChecklist } from "../components/ui/PasswordChecklist";
import {
  isPasswordValid,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../utils/authValidation";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();

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
    // The reset link signs you in to authorise the change, so anyone who got
    // this far already has a session — including a signed-in user who came
    // here from settings because they'd forgotten their current password.
    // Only offer the sign-in page to someone who somehow doesn't.
    const signedIn = Boolean(user);

    return (
      <AuthLayout title="Password updated">
        <AuthStatusCard
          icon={CheckCircle2Icon}
          iconVariant="green"
          action={
            <Button
              type="button"
              fullWidth
              onClick={() => navigate(signedIn ? "/" : "/signin")}
            >
              {signedIn ? "Continue to Issho" : "Continue to sign in"}
            </Button>
          }
        >
          <p>
            Your password has been changed.{" "}
            {signedIn
              ? "You're signed in on this device — use the new password next time you sign in."
              : "You can now sign in with your new password."}
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
        {formError && <Banner message={formError} />}
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <PasswordChecklist password={password} confirmPassword={confirm} />
        <Button
          type="submit"
          loading={loading}
          fullWidth
          disabled={!isPasswordValid(password) || confirm !== password}
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
};
