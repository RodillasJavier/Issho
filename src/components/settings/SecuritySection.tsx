/**
 * src/components/settings/SecuritySection.tsx
 *
 * Changing the account password from inside the app, without signing out or
 * walking the reset-link flow.
 */
import { useState } from "react";
import { Link } from "react-router";
import type { User } from "@supabase/supabase-js";
import { KeyRoundIcon } from "lucide-react";
import { changePassword } from "../../services/supabase/account";
import { isPasswordValid } from "../../utils/authValidation";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Banner } from "../ui/Banner";
import { Disclosure } from "../ui/Disclosure";
import { TextField } from "../ui/TextField";
import { PasswordChecklist } from "../ui/PasswordChecklist";
import { PasswordStrengthMeter } from "../ui/PasswordStrengthMeter";
import { cn, focusRing, surface, text } from "../../styles/tokens";

interface SecuritySectionProps {
  user: User;
}

export function SecuritySection({ user }: SecuritySectionProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    current.length > 0 && isPasswordValid(next) && next === confirm;

  const close = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setDone(false);
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await changePassword(user.email ?? "", current, next);
      close();
      setDone(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not update your password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Password"
      description="Change your password without signing out or using a reset link."
    >
      <div className="space-y-4" aria-live="polite">
        {done && (
          <Banner
            tone="success"
            message="Password updated. You stay signed in on this device."
          />
        )}

        <div
          className={cn(
            surface.inset,
            "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <div className="flex items-center gap-3">
            <KeyRoundIcon
              className="h-4 w-4 shrink-0 text-content-subtle"
              aria-hidden
            />
            <div>
              <p className="text-sm text-content">••••••••••••</p>
              <p className={text.hint}>
                You&apos;ll need your current password — or a reset link if you
                don&apos;t have it.
              </p>
            </div>
          </div>

          {!open && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDone(false);
                setOpen(true);
              }}
              aria-expanded={open}
              aria-controls="change-password-form"
            >
              Change password
            </Button>
          )}
        </div>

        <Disclosure open={open} id="change-password-form">
          <form
            onSubmit={handleSubmit}
            noValidate
            className={cn(surface.inset, "space-y-4 p-4 sm:p-5")}
          >
            <div>
              <TextField
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
              {/* Anyone who can't fill this in belongs in the existing
                  reset-link flow rather than a second copy of it here. */}
              <Link
                to="/forgot-password"
                className={cn(
                  "mt-1.5 inline-block rounded text-xs font-semibold text-accent",
                  "transition-colors hover:text-accent-line",
                  focusRing
                )}
              >
                Forgot your current password?
              </Link>
            </div>

            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />

            <PasswordStrengthMeter password={next} />

            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={mismatch ? "Passwords do not match." : undefined}
            />

            <PasswordChecklist password={next} confirmPassword={confirm} />

            {formError && <Banner message={formError} />}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!canSubmit}
              >
                {submitting ? "Updating" : "Update password"}
              </Button>
            </div>
          </form>
        </Disclosure>
      </div>
    </Card>
  );
}
