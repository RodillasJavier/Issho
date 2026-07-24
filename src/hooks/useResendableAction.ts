/**
 * src/hooks/useResendableAction.ts
 *
 * Tracks idle/sending/sent state around a "resend" action (confirmation
 * email, password reset link). The wrapped action may return `false` to
 * indicate failure (reverting to idle); any other result is treated as sent.
 */
import { useState } from "react";

type ResendState = "idle" | "sending" | "sent";

export function useResendableAction(action: () => Promise<boolean | void>) {
  const [resendState, setResendState] = useState<ResendState>("idle");

  const resend = async () => {
    setResendState("sending");
    const ok = await action();
    setResendState(ok === false ? "idle" : "sent");
  };

  const reset = () => setResendState("idle");

  return { resendState, resend, reset };
}
