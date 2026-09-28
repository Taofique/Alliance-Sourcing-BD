import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import type { SourcingCategoryInput, SourcingSettings } from "@/types/sourcing";

export type SourcingCategoryRecord = SourcingCategoryInput & {
  slug: string;
  imageUrl: string;
  publicId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
const categorySchema = new Schema<SourcingCategoryRecord>({
  slug: { type: String, required: true, unique: true, immutable: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  publicId: { type: String, default: null },
  imageAlt: { type: String, required: true, trim: true },
  sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
  isPublished: { type: Boolean, required: true, default: false },
}, { timestamps: true, collection: "sourcing_categories" });
categorySchema.index({ isPublished: 1, sortOrder: 1, createdAt: 1, _id: 1 });

type SettingsRecord = SourcingSettings & { key: string };
const settingsSchema = new Schema<SettingsRecord>({
  key: { type: String, required: true, unique: true },
  eyebrow: { type: String, required: true, trim: true },
  heading: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  ctaText: { type: String, required: true, trim: true },
  ctaHref: { type: String, required: true, enum: ["/buying-house"] },
}, { timestamps: true, collection: "sourcing_section_settings" });

export const SourcingCategoryModel =
  (models.SourcingCategory as Model<SourcingCategoryRecord> | undefined) ??
  model<SourcingCategoryRecord>("SourcingCategory", categorySchema);
export const SourcingSettingsModel =
  (models.SourcingSectionSettings as Model<SettingsRecord> | undefined) ??
  model<SettingsRecord>("SourcingSectionSettings", settingsSchema);

