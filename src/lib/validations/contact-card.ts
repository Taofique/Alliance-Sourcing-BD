import { z } from "zod";
import {
  CONTACT_CARD_ICON_KEYS,
  CONTACT_CARD_TYPES,
} from "@/types/contact-card";

export const CONTACT_CARD_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * A link an editor typed becomes an `href` on the public page, so only the
 * schemes that can legitimately appear on a contact card are accepted. This is
 * what stops a `javascript:` URL stored in Mongo from being served to a visitor.
 */
const SAFE_SCHEME = /^(https?:\/\/|mailto:|tel:)/i;

const linkText = (noun: string) =>
  z.string().trim().max(2000, `Keep the ${noun} under 2000 characters.`);

/** A link an editor is allowed to leave blank, as when a value is not clickable. */
const optionalLink = (noun: string) =>
  linkText(noun)
    .refine(
      (value) => value === "" || SAFE_SCHEME.test(value),
      `Start the ${noun} with https://, mailto: or tel:.`,
    )
    .nullable()
    .optional()
    .transform((value) => value || null);

/** A link that has to lead somewhere, so blank is not an option. */
const requiredLink = (noun: string) =>
  linkText(noun).refine(
    (value) => SAFE_SCHEME.test(value),
    `Start the ${noun} with https://, mailto: or tel:.`,
  );

/** A value may be shown without being linked, so an empty link becomes null. */
const valueSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Enter a value.")
      .max(200, "Keep a value under 200 characters."),
    href: optionalLink("link"),
  })
  .strict();

const actionSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "Enter the action label.")
      .max(60, "Keep the action label under 60 characters."),
    href: requiredLink("action link"),
  })
  .strict();

const fields = {
  type: z.enum(CONTACT_CARD_TYPES),
  label: z
    .string()
    .trim()
    .min(1, "Enter a label.")
    .max(60, "Keep the label under 60 characters."),
  description: z
    .string()
    .trim()
    .max(300, "Keep the description under 300 characters.")
    .default(""),
  values: z
    .array(valueSchema)
    .max(8, "A card can hold up to 8 values.")
    .default([]),
  action: actionSchema.nullable().optional().default(null),
  iconKey: z.enum(CONTACT_CARD_ICON_KEYS),
  /**
   * Rendered as an iframe `src`, so it is held to `https` alone — a `http` embed
   * would be blocked as mixed content anyway.
   */
  mapEmbedUrl: z
    .string()
    .trim()
    .max(2000, "Keep the map link under 2000 characters.")
    .refine(
      (value) => value === "" || value.startsWith("https://"),
      "Use an https:// map embed link.",
    )
    .default(""),
  sortOrder: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
};

/** A card with no text at all would render as an empty box. */
const mustShowSomething = (card: {
  description: string;
  values: unknown[];
  action: unknown;
}) =>
  card.description.length > 0 ||
  card.values.length > 0 ||
  Boolean(card.action);

export const contactCardCreateSchema = z
  .object(fields)
  .strict()
  .refine(mustShowSomething, "Add a description, a value or an action link.");

/**
 * The same rules applied to an existing record merged with a partial update, so
 * clearing the last field of a card is rejected rather than leaving a blank box.
 */
export const contactCardMergedSchema = z
  .object(fields)
  .strict()
  .refine(mustShowSomething, "Add a description, a value or an action link.");

export const contactCardUpdateSchema = z
  .object(fields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

export const contactCardOrderSchema = z
  .object({
    ids: z
      .array(z.string().regex(CONTACT_CARD_ID_PATTERN))
      .min(1)
      .max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each card must appear exactly once.",
      ),
  })
  .strict();
