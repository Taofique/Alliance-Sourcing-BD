/**
 * A contact card is one box in the grid at the top of /contact: an icon, a label,
 * a line of supporting text, any number of linked values, and an optional action
 * such as "Get directions".
 *
 * The live page has three boxes — Email, Phone and Office — but nothing about the
 * markup assumes three. The grid maps over whatever the collection returns, so an
 * editor can add a fourth box, or hide one, without a code change.
 */
export const CONTACT_CARD_TYPES = [
  "phone",
  "email",
  "office",
  "hours",
] as const;
export type ContactCardType = (typeof CONTACT_CARD_TYPES)[number];

/**
 * The pictogram set an editor may choose from, stored as a key rather than a
 * component so the record stays serialisable. `iconKey` is deliberately separate
 * from `type`: an office box could reasonably show a building or a pin.
 */
export const CONTACT_CARD_ICON_KEYS = [
  "mail",
  "phone",
  "mapPin",
  "clock",
] as const;
export type ContactCardIconKey = (typeof CONTACT_CARD_ICON_KEYS)[number];

/**
 * One clickable line inside a card, such as an address or a phone number.
 * `href` is null for a value that is shown but not linked.
 */
export type ContactCardValue = {
  text: string;
  href: string | null;
};

/** A trailing link with its own label, such as "Get directions". */
export type ContactCardAction = {
  label: string;
  href: string;
};

export type ContactCardInput = {
  type: ContactCardType;
  label: string;
  /** Secondary grey line under the label. Empty when the card has none. */
  description: string;
  values: ContactCardValue[];
  action: ContactCardAction | null;
  iconKey: ContactCardIconKey;
  /**
   * An `https` map embed for the box beside the message form. Only the first
   * active card carrying one is used, so the map moves with whichever card
   * describes the office. Empty means no map.
   */
  mapEmbedUrl: string;
  sortOrder: number;
  isActive: boolean;
};

/** What the public page renders: no timestamps. */
export type ContactCard = ContactCardInput & { id: string };

export type AdminContactCard = ContactCard & {
  createdAt: string;
  updatedAt: string;
};
