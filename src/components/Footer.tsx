/**
 * src/components/Footer.tsx
 *
 * Site-wide footer rendered once by AppShell. Not shown on the auth pages,
 * which render outside AppShell with their own full-bleed layout.
 */
import { FOOTER_LINKS } from "../constants/footerLinks";
import { cn, focusRing, text } from "../styles/tokens";

export const Footer = () => {
  return (
    <footer className="border-t border-line">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.id}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={cn(
                    "flex items-center gap-1.5 text-sm text-content-muted transition-colors",
                    "hover:text-accent-text-hover",
                    focusRing
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <p className={text.hint}>© {new Date().getFullYear()} Issho</p>
      </div>
    </footer>
  );
};
