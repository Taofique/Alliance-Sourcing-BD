import "server-only";

import { Schema, model, models, type Model } from "mongoose";
import type { PublicSiteSettings } from "@/types/site-settings";

type SiteSettingsRecord = PublicSiteSettings & {
  key: string;
};

const phoneSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const contactSchema = new Schema(
  {
    phones: {
      type: [phoneSchema],
      required: true,
    },
    topBarEmails: {
      type: [String],
      required: true,
    },
  },
  { _id: false },
);

const logoSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { _id: false },
);

const siteSettingsSchema = new Schema<SiteSettingsRecord>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ["main"],
    },
    contact: {
      type: contactSchema,
      required: true,
    },
    logos: {
      type: [logoSchema],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "site_settings",
  },
);

export const SiteSettings =
  (models.SiteSettings as Model<SiteSettingsRecord> | undefined) ??
  model<SiteSettingsRecord>("SiteSettings", siteSettingsSchema);
