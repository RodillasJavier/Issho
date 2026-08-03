/**
 * src/services/supabase/account.ts
 *
 * Changing the credentials on the signed-in account — email and password.
 *
 * Both operations re-verify the current password first. Supabase's
 * `updateUser` does not check it, so without this step anyone who reaches an
 * unlocked tab could seize the account permanently. `auth.reauthenticate()`
 * is not the tool for that — it emails a six-digit nonce and takes no
 * password — so `signInWithPassword` is the only client-side verifier.
 *
 * Consequences of verifying that way, all verified against auth-js:
 *  - A successful check mints a *new* session for the same user and fires
 *    `SIGNED_IN`. Harmless today, but anything later that reacts to that
 *    event (a welcome toast, an analytics call, a redirect) will misfire on
 *    every password and email change.
 *  - A *failed* check leaves the existing session intact — the session is
 *    only persisted on success — so a wrong password never signs you out.
 *  - It bumps `user.updated_at`, which is why that field can't be read as a
 *    "password last changed" timestamp.
 *  - It counts against the token endpoint's rate limit (30 per 5 minutes by
 *    default).
 */
import supabase from "../../supabase-client";

/** Thrown when the current-password check fails. */
export class IncorrectPasswordError extends Error {
  constructor(message = "That password is incorrect.") {
    super(message);
    this.name = "IncorrectPasswordError";
  }
}

/**
 * Confirm the signed-in user knows their current password.
 *
 * Anything other than a credential mismatch (rate limiting, network failure)
 * is rethrown as-is so the form can show the real cause instead of blaming
 * the password.
 */
const reauthenticate = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return;

  if (error.code === "invalid_credentials") throw new IncorrectPasswordError();
  throw new Error(error.message);
};

/**
 * Start an email change. Supabase sends a confirmation link and only swaps the
 * address once it's clicked, so nothing changes until the user acts on the
 * email. With secure email change enabled (the default) the link goes to both
 * the old and new addresses and both must be confirmed.
 *
 * @param currentEmail the address currently on the account
 * @param currentPassword the account password, to prove identity
 * @param newEmail the address to move to
 */
export const requestEmailChange = async (
  currentEmail: string,
  currentPassword: string,
  newEmail: string
): Promise<void> => {
  if (newEmail === currentEmail) {
    throw new Error("That is already your email address.");
  }

  await reauthenticate(currentEmail, currentPassword);

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${window.location.origin}/settings?tab=account` }
  );
  if (error) throw new Error(error.message);
};

/**
 * Re-send the confirmation link for an email change already in flight.
 * Re-requesting the same address is how Supabase resends — there is no
 * separate resend endpoint for this flow.
 */
export const resendEmailChange = requestEmailChange;

/**
 * Change the account password without signing out or using a reset link.
 *
 * @param email the account's email, needed to verify the current password
 * @param currentPassword the password being replaced
 * @param newPassword the password to set
 */
export const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  if (newPassword === currentPassword) {
    throw new Error(
      "Your new password must be different from the current one."
    );
  }

  await reauthenticate(email, currentPassword);

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};
