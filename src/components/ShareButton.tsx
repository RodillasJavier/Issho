/**
 * src/components/ShareButton.tsx
 *
 * Copies the current page URL to the clipboard, for sharing an anime/series
 * page. Sits in DetailSidebar's actions alongside "Create an entry" and
 * ListStatusButton; not gated on sign-in, since sharing needs no account.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

const COPIED_TIMEOUT_MS = 2000;

export const ShareButton = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    let succeeded = true;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — fall back to
      // the classic hidden-textarea copy trick. The inner try/finally
      // guarantees the temporary field is always removed (execCommand is
      // deprecated and can throw in some browsers/security contexts) and
      // that a failed copy doesn't falsely report success below.
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "absolute";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      try {
        field.select();
        succeeded = document.execCommand("copy");
      } catch {
        succeeded = false;
      } finally {
        document.body.removeChild(field);
      }
    }

    if (!succeeded) return;

    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => setCopied(false),
      COPIED_TIMEOUT_MS
    );
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleShare}
        aria-label={
          copied ? "Link copied to clipboard" : "Copy link to this page"
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        {copied ? (
          <Check aria-hidden className="size-4 text-green-400" />
        ) : (
          <Share2 aria-hidden className="size-4 text-rose-300" />
        )}
        {copied ? "Link copied" : "Share"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
};
