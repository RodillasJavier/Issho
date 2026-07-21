/**
 * src/components/EntryTypeIcon.tsx
 *
 * Icon paired with an entry type's label (see constants/entryTypes.ts).
 */
import { FileText, Star, Tv } from "lucide-react";

interface EntryTypeIconProps {
  type: string;
  className?: string;
}

export const EntryTypeIcon = ({ type, className }: EntryTypeIconProps) => {
  switch (type) {
    case "review":
      return <FileText className={className} />;
    case "rating":
      return <Star className={className} />;
    case "status_update":
      return <Tv className={className} />;
    default:
      return <FileText className={className} />;
  }
};
