/**
 * src/constants/footerLinks.ts
 *
 * The links shown in the site footer.
 */
import {
  CoffeeIcon,
  MailIcon,
  MessageSquareIcon,
  type LucideIcon,
} from "lucide-react";

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Opens in a new tab with rel="noopener noreferrer". */
  external?: boolean;
}

export const FOOTER_LINKS: FooterLink[] = [
  {
    id: "email",
    label: "Email",
    href: "mailto:isshoanime@gmail.com",
    icon: MailIcon,
  },
  {
    id: "feedback",
    label: "Feedback",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSfhIkO2jTj9DwGMeqmekJzlxedHLge2ZNcudsVp3JI_4J1AyQ/viewform",
    icon: MessageSquareIcon,
    external: true,
  },
  {
    id: "support",
    label: "Support",
    href: "https://buymeacoffee.com/rodillasjavier",
    icon: CoffeeIcon,
    external: true,
  },
];
