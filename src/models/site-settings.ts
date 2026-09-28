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

const footerLinkSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const footerSocialSchema = new Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "instagram", "linkedin", "youtube", "x"],
    },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * Every footer and footer-CTA field is optional so documents written before
 * these editors existed still validate. `services/site-settings.ts` fills the
 * gaps from `lib/footer-defaults.ts` on read, which is why nothing here needs a
 * migration to be safe.
 */
const footerSchema = new Schema(
  {
    brandDescription: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    emails: { type: [String], default: null },
    quickLinks: { type: [footerLinkSchema], default: null },
    socials: { type: [footerSocialSchema], default: null },
    whatsappNumber: { type: String, default: null, trim: true },
    whatsappMessage: { type: String, default: null, trim: true },
    copyrightOwner: { type: String, default: null, trim: true },
    legalLinks: { type: [footerLinkSchema], default: null },
    attribution: { type: footerLinkSchema, default: null },
  },
  { _id: false },
);

const footerCtaSchema = new Schema(
  {
    enabled: { type: Boolean, default: null },
    heading: { type: String, default: null, trim: true },
    description: { type: String, default: null, trim: true },
    buttonText: { type: String, default: null, trim: true },
    buttonHref: { type: String, default: null, trim: true },
    image: {
      type: new Schema(
        {
          imageUrl: { type: String, required: true, trim: true },
          publicId: { type: String, required: true, trim: true },
        },
        { _id: false },
      ),
      default: null,
    },
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
    footer: {
      type: footerSchema,
      default: null,
    },
    footerCta: {
      type: footerCtaSchema,
      default: null,
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
