/**
 * src/components/ui/StatusPill.tsx
 *
 * Compact state badge — verification status, pending changes.
 */
import type { LucideIcon } from "lucide-react";
import { banner, cn, radius } from "../../styles/tokens";

type PillTone = "verified" | "pending" | "attention" | "neutral";

const TONE_CLASSES: Record<PillTone, string> = {
  verified: banner.success,
  pending: banner.warning,
  attention: banner.danger,
  neutral: banner.info,
};

interface StatusPillProps {
  tone: PillTone;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function StatusPill({ tone, icon: Icon, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1",
        "font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
        radius.pill,
        TONE_CLASSES[tone]
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}
