/**
 * src/components/settings/AccountSection.tsx
 *
 * Email address and read-only account facts.
 */
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  MailIcon,
} from "lucide-react";
import {
  requestEmailChange,
  resendEmailChange,
} from "../../services/supabase/account";
import { useResendableAction } from "../../hooks/useResendableAction";
import { EMAIL_RE } from "../../utils/authValidation";
import type { Profile } from "../../types/database.types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Banner } from "../ui/Banner";
import { Disclosure } from "../ui/Disclosure";
import { StatusPill } from "../ui/StatusPill";
import { TextField } from "../ui/TextField";
import { cn, surface, text } from "../../styles/tokens";

interface AccountSectionProps {
  user: User;
  profile: Profile;
}

export function AccountSection({ user, profile }: AccountSectionProps) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentEmail = user.email ?? "";
  // Supabase writes the in-flight address onto the session user, so this
  // survives a reload without any local mirror of it.
  const pendingEmail = user.new_email ?? null;

  const { resendState, resend } = useResendableAction(async () => {
    if (!pendingEmail) return false;
    try {
      await resendEmailChange(currentEmail, password, pendingEmail);
      setFormError("");
      return true;
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not resend the link."
      );
      return false;
    }
  });

  const close = () => {
    setOpen(false);
    setNewEmail("");
    setPassword("");
    setFieldError(undefined);
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!EMAIL_RE.test(newEmail)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setFieldError(undefined);
      setFormError("Enter your current password to confirm it's you.");
      return;
    }
    setFieldError(undefined);

    setSubmitting(true);
    try {
      await requestEmailChange(currentEmail, password, newEmail);
      close();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not start the email change."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Email address"
        description="Used for sign-in, verification, and account recovery."
      >
        <div className="space-y-4" aria-live="polite">
          <div
            className={cn(
              surface.inset,
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <MailIcon
                className="h-4 w-4 shrink-0 text-content-subtle"
                aria-hidden
              />
              <span className="truncate text-sm text-content">
                {currentEmail}
              </span>
            </div>
            {user.email_confirmed_at ? (
              <StatusPill tone="verified" icon={CheckCircle2Icon}>
                Verified
              </StatusPill>
            ) : (
              <StatusPill tone="attention" icon={AlertTriangleIcon}>
                Unverified
              </StatusPill>
            )}
          </div>

          {pendingEmail ? (
            <div
              className={cn(
                surface.inset,
                "space-y-3 border-warning/40 px-4 py-3.5"
              )}
            >
              <StatusPill tone="pending" icon={ClockIcon}>
                Pending
              </StatusPill>
              <p className={text.body}>
                We sent a confirmation link to{" "}
                <span className="text-content">{currentEmail}</span> and{" "}
                <span className="text-content">{pendingEmail}</span>. Both have
                to be confirmed before{" "}
                <span className="text-content">{pendingEmail}</span> becomes
                your sign-in address.
              </p>
              <p className={text.hint}>
                This request expires in 24 hours, or is replaced the next time
                you request a change.
              </p>

              <TextField
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                hint="Needed again to resend the link."
              />
              {formError && <Banner message={formError} />}
              <Button
                size="sm"
                variant="secondary"
                onClick={resend}
                disabled={resendState !== "idle" || !password}
              >
                {resendState === "sent" ? "Link resent" : "Resend link"}
              </Button>
            </div>
          ) : (
            <>
              {!open && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOpen(true)}
                  aria-expanded={open}
                  aria-controls="change-email-form"
                >
                  Change email
                </Button>
              )}

              <Disclosure open={open} id="change-email-form">
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className={cn(surface.inset, "space-y-4 p-4 sm:p-5")}
                >
                  <TextField
                    label="New email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    error={fieldError}
                    hint="We'll send a confirmation link before switching it over."
                  />
                  <TextField
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    hint="Required to confirm it's really you."
                  />

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
                    <Button type="submit" size="sm" loading={submitting}>
                      {submitting ? "Sending" : "Send confirmation"}
                    </Button>
                  </div>
                </form>
              </Disclosure>
            </>
          )}
        </div>
      </Card>

      <Card
        title="Account details"
        description="Read-only info about this account."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className={cn(surface.inset, "px-4 py-3.5")}>
            <dt className={text.eyebrow}>Handle</dt>
            <dd className="mt-1 text-sm text-content">@{profile.username}</dd>
          </div>
          <div className={cn(surface.inset, "px-4 py-3.5")}>
            <dt className={text.eyebrow}>Joined</dt>
            <dd className="mt-1 text-sm text-content">
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
