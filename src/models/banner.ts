import "server-only";

import { Schema, model, models, type Model } from "mongoose";

type BannerRecord = {
  title: string;
  description: string;
  imageUrl: string;
  publicId: string | null;
  imageAlt: string;
  cta: { text: string; href: string } | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const ctaSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const bannerSchema = new Schema<BannerRecord>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    publicId: { type: String, default: null },
    imageAlt: { type: String, required: true, trim: true },
    cta: { type: ctaSchema, default: null },
    sortOrder: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    collection: "banners",
  },
);

// Deterministic ordering: explicit sort order first, then creation time, then id.
bannerSchema.index({ isPublished: 1, sortOrder: 1, createdAt: 1, _id: 1 });

export const Banner =
  (models.Banner as Model<BannerRecord> | undefined) ??
  model<BannerRecord>("Banner", bannerSchema);
