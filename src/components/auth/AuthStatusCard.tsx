/**
 * src/components/auth/AuthStatusCard.tsx
 *
 * Shared "we did the thing" confirmation panel shown after sign up,
 * forgot-password, and reset-password submissions — an icon, a message,
 * an optional action (e.g. resend), and an optional footer link.
 */
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn, radius } from "../../styles/tokens";

interface AuthStatusCardProps {
  icon: LucideIcon;
  iconVariant?: "rose" | "green";
  children: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthStatusCard({
  icon: Icon,
  iconVariant = "rose",
  children,
  action,
  footer,
}: AuthStatusCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "border border-line bg-surface p-6 text-center",
        radius.card
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          iconVariant === "green"
            ? "bg-success/15 text-success"
            : "bg-accent/15 text-accent-line"
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="text-content">{children}</div>
      {action && <div className="mt-6 space-y-3">{action}</div>}
      {footer}
    </motion.div>
  );
}
