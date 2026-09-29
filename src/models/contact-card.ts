import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import type {
  ContactCardAction,
  ContactCardIconKey,
  ContactCardType,
  ContactCardValue,
} from "@/types/contact-card";

export type ContactCardRecord = {
  type: ContactCardType;
  label: string;
  description: string;
  values: ContactCardValue[];
  action: ContactCardAction | null;
  iconKey: ContactCardIconKey;
  mapEmbedUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const valueSchema = new Schema<ContactCardValue>(
  {
    text: { type: String, required: true, trim: true },
    href: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const actionSchema = new Schema<ContactCardAction>(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * One box in the /contact grid.
 *
 * `sortOrder` is the published position and `isActive` is the publish flag; an
 * inactive card stays in the admin list but is never rendered. Sub-schemas are
 * declared without an `_id`, because a value line and an action link are values
 * of the card rather than documents of their own.
 */
const contactCardSchema = new Schema<ContactCardRecord>(
  {
    type: {
      type: String,
      required: true,
      enum: ["phone", "email", "office", "hours"],
    },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    values: { type: [valueSchema], default: [] },
    action: { type: actionSchema, default: null },
    iconKey: {
      type: String,
      required: true,
      enum: ["mail", "phone", "mapPin", "clock"],
    },
    mapEmbedUrl: { type: String, default: "", trim: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "contact_cards" },
);

/** Serves the public grid (active only) and the admin list in published order. */
contactCardSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1, _id: 1 });

export const ContactCardModel =
  (models.ContactCard as Model<ContactCardRecord> | undefined) ??
  model<ContactCardRecord>("ContactCard", contactCardSchema);
