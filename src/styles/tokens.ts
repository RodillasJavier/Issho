/**
 * src/styles/tokens.ts
 *
 * Composite class recipes built on the semantic color tokens in
 * `src/index.css`. Colors live there (as `@theme` entries, so Tailwind
 * generates `bg-surface`, `border-line`, `text-accent-line`, … including
 * opacity modifiers); anything that combines more than a color lives here.
 *
 * `cn()` is a filtered join, NOT tailwind-merge. In Tailwind v4 the order of
 * classes in the attribute does not decide which one wins — the generated
 * stylesheet's rule order does — so `cn("px-3", "px-8")` is not reliably
 * `px-8`. Two rules keep that from mattering:
 *
 *   1. Primitives expose a prop for every axis a caller might otherwise want
 *      to override (`variant`, `size`, `fullWidth`, `tone`, `error`).
 *      Conditional branches pick exactly one class; they never stack two.
 *   2. A caller's `className` is ADDITIVE ONLY — layout the parent owns
 *      (`mt-4`, `sm:w-auto`, `col-span-2`), never a respec of a base class.
 *
 * Nothing mechanical enforces rule 2. If the rest of the app is ever migrated
 * onto these tokens and call sites start needing real overrides, that is the
 * moment to reach for tailwind-merge — not a moment earlier.
 */

export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

/** App-canonical focus treatment: no ring offset, accent-line ring. */
export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-line";

export const radius = {
  control: "rounded-md",
  card: "rounded-xl",
  inset: "rounded-lg",
  pill: "rounded-full",
} as const;

export const text = {
  /** The app's signature mono eyebrow, above page and section titles. */
  eyebrow:
    "font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent-line",
  pageTitle: "text-3xl font-semibold tracking-tight text-content sm:text-4xl",
  pageSubtitle: "mt-2 max-w-2xl text-sm leading-6 text-content-subtle",
  sectionTitle: "text-base font-semibold text-content",
  body: "text-sm leading-6 text-content-muted",
  hint: "text-xs leading-5 text-content-subtle",
  label: "text-xs font-semibold uppercase tracking-[0.08em] text-content-muted",
  error: "text-sm text-danger",
} as const;

export const surface = {
  card: cn("border border-line bg-surface", radius.card),
  cardHeader: "border-b border-line-subtle px-5 py-4 sm:px-6",
  cardBody: "px-5 py-5 sm:px-6",
  cardFooter: "border-t border-line-subtle bg-surface-sunken px-5 py-4 sm:px-6",
  inset: cn("border border-line bg-surface-sunken", radius.inset),
} as const;

/** Tone recipes shared by Banner and StatusPill. */
export const banner = {
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  success: "border-success/40 bg-success/10 text-success",
  info: "border-line bg-surface-sunken text-content-muted",
} as const;

export const control = {
  base: cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
    radius.control,
    focusRing
  ),
  size: {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
  },
  variant: {
    primary: "bg-accent text-white hover:bg-accent-hover",
    secondary:
      "border border-line bg-surface-sunken text-content hover:border-line-strong hover:bg-surface",
    ghost: "text-content-muted hover:bg-surface hover:text-content",
    danger:
      "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  },
  /** Shared by TextField and TextArea; pair with fieldIdle or fieldError. */
  field: cn(
    "w-full border bg-field px-3.5 py-2.5 text-sm text-content",
    "placeholder:text-content-faint outline-none transition-[border-color,box-shadow] duration-200",
    radius.inset
  ),
  fieldIdle:
    "border-line focus-visible:border-accent-line focus-visible:ring-2 focus-visible:ring-accent-line/20",
  fieldError:
    "border-danger-strong focus-visible:border-danger-strong focus-visible:ring-2 focus-visible:ring-danger-strong/20",
} as const;

export const page = {
  /** AppShell already supplies `container mx-auto px-4 py-6` — don't re-add it. */
  shell: "mx-auto max-w-5xl pb-12",
  header: "mb-8 border-b border-line pb-6",
} as const;
