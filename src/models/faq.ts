import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import type { FaqInput } from "@/types/faq";

export type FaqRecord = FaqInput & {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * One question and answer on /global-partners.
 *
 * A FAQ is text only, so there is no image to keep in step with the record.
 * `sortOrder` is the published position and `isActive` is the publish flag; an
 * inactive entry stays in the admin list but is never rendered on the page.
 */
const faqSchema = new Schema<FaqRecord>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "faqs" },
);

/** Serves the public list (active first) and the admin list in published order. */
faqSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1, _id: 1 });

export const FaqModel =
  (models.Faq as Model<FaqRecord> | undefined) ??
  model<FaqRecord>("Faq", faqSchema);
