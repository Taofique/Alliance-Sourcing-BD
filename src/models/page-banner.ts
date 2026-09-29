import "server-only";

import { Schema, model, models, type Model } from "mongoose";
import {
  PAGE_BANNER_SLUGS,
} from "@/lib/page-banner-routes";

export { isPageBannerSlug } from "@/lib/page-banner-routes";
export type { PageBannerSlug } from "@/lib/page-banner-routes";

type PageBannerRecord = {
  page: string;
  image: { imageUrl: string; publicId: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

const pageBannerImageSchema = new Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * One document per page, so a page banner is edited and stored on its own
 * rather than as a new field on the site-wide settings document.
 */
const pageBannerSchema = new Schema<PageBannerRecord>(
  {
    page: {
      type: String,
      required: true,
      unique: true,
      enum: PAGE_BANNER_SLUGS as unknown as string[],
      lowercase: true,
      trim: true,
    },
    image: {
      type: pageBannerImageSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "page_banners",
  },
);

export const PageBanner =
  (models.PageBanner as Model<PageBannerRecord> | undefined) ??
  model<PageBannerRecord>("PageBanner", pageBannerSchema);
