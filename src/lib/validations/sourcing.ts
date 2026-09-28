import { z } from "zod";

export const SOURCING_ID_PATTERN = /^[a-f\d]{24}$/i;
export const sourcingImageSchema = z.object({
  imageUrl: z.string().trim().min(1, "Upload a category photograph.").max(2048),
  publicId: z.string().regex(/^alliance-sourcing-bd\/sourcing\/[A-Za-z0-9_-]{8,64}$/, "Use an image uploaded through this editor."),
}).strict().refine(({ imageUrl, publicId }) => {
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloud) return false;
    const url = new URL(imageUrl);
    if (url.origin !== "https://res.cloudinary.com" || url.search || url.hash) return false;
    const prefix = "/" + cloud + "/image/upload/";
    if (!url.pathname.startsWith(prefix)) return false;
    const path = url.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    return path === publicId + ".webp" || path === publicId + ".png";
  } catch { return false; }
}, "The image reference does not match a sourcing upload.");

const fields = {
  title: z.string().trim().min(1, "Enter a title.").max(160),
  description: z.string().trim().min(1, "Enter a description.").max(600),
  imageAlt: z.string().trim().min(1, "Describe the category photograph.").max(200),
  sortOrder: z.number().int().min(0).max(9999),
  isPublished: z.boolean(),
};
export const sourcingCreateSchema = z.object({ ...fields, image: sourcingImageSchema }).strict();
export const sourcingUpdateSchema = z.object({ ...fields, image: sourcingImageSchema.optional() }).strict().partial()
  .refine(value => Object.keys(value).length > 0, "Send at least one field.");
export const sourcingOrderSchema = z.object({
  ids: z.array(z.string().regex(SOURCING_ID_PATTERN)).min(1).max(200)
    .refine(ids => new Set(ids).size === ids.length, "Each category must appear exactly once."),
}).strict();
export const sourcingSettingsSchema = z.object({
  eyebrow: z.string().trim().min(1).max(60),
  heading: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(600),
  ctaText: z.string().trim().min(1).max(60),
  ctaHref: z.literal("/buying-house"),
}).strict();

