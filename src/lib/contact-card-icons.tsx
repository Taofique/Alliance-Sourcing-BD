import { Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  CONTACT_CARD_ICON_KEYS,
  type ContactCardIconKey,
} from "@/types/contact-card";

/** Used when a record names an icon this build does not know about. */
export const DEFAULT_CONTACT_CARD_ICON: ContactCardIconKey = "mail";

export function isContactCardIconKey(
  value: unknown,
): value is ContactCardIconKey {
  return (
    typeof value === "string" &&
    (CONTACT_CARD_ICON_KEYS as readonly string[]).includes(value)
  );
}

type ContactCardGlyphProps = {
  /**
   * The stored `iconKey`. The admin editor imports this too, so the module stays
   * free of `server-only` and of the model and service.
   */
  iconKey: string | null | undefined;
  className?: string;
};

/**
 * The pictogram in a contact card's tinted square.
 *
 * Each branch renders a directly imported component rather than a component
 * chosen from a lookup at render time, which is both what the lint rules want and
 * what keeps the mapping easy to read.
 *
 * The fallback is not decoration. `iconKey` is editable data, so a card saved
 * against an older build, or one whose key was hand-edited in Mongo, must still
 * render something rather than a hole in the card.
 */
export function ContactCardGlyph({ iconKey, className }: ContactCardGlyphProps) {
  switch (iconKey) {
    case "phone":
      return <Phone aria-hidden="true" className={className} />;
    case "mapPin":
      return <MapPin aria-hidden="true" className={className} />;
    case "clock":
      return <Clock aria-hidden="true" className={className} />;
    case "mail":
    default:
      return <Mail aria-hidden="true" className={className} />;
  }
}
