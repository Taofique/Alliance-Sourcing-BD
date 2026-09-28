import { z } from "zod";

const MAX_TITLE = 160;
const MAX_DESCRIPTION = 600;
const MAX_ALT = 200;
const MAX_CTA_TEXT = 60;

/**
 * CTA destinations are limited to same-site absolute paths or HTTPS URLs.
 * Rejected: protocol-relative ("//host"), backslashes, javascript:, data:,
 * credentials in the authority, and any non-HTTPS scheme.
 */
export function isAllowedBannerHref(value: string) {
  if (value.includes("\\")) return false;

  if (value.startsWith("/")) {
    // Exactly one leading slash: "//evil.test" is protocol-relative.
    return !value.startsWith("//");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.hostname.length > 0
  );
}

const ctaSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter a button label.")
    .max(MAX_CTA_TEXT, `Use ${MAX_CTA_TEXT} characters or fewer.`),
  href: z
    .string()
    .trim()
    .min(1, "Enter a destination.")
    .max(2048, "That destination is too long.")
    .refine(isAllowedBannerHref, {
      message:
        "Use a site path starting with one slash (for example /about) or a full https:// address.",
    }),
});

const bannerFields = {
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(MAX_TITLE, `Use ${MAX_TITLE} characters or fewer.`),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(MAX_DESCRIPTION, `Use ${MAX_DESCRIPTION} characters or fewer.`),
  imageAlt: z
    .string()
    .trim()
    .min(1, "Describe the background image for screen readers.")
    .max(MAX_ALT, `Use ${MAX_ALT} characters or fewer.`),
  cta: ctaSchema.nullable(),
  sortOrder: z
    .number()
    .int("Sort order must be a whole number.")
    .min(0, "Sort order cannot be negative.")
    .max(9999, "Sort order must be 9999 or lower."),
  isPublished: z.boolean(),
};

/**
 * Only images this app uploaded into the dedicated Cloudinary banner folder may
 * be referenced, so a record can never be pointed at an arbitrary asset.
 */
export const bannerImageReferenceSchema = z
  .object({
    imageUrl: z
      .string()
      .trim()
      .min(1, "Upload a background image first.")
      .max(2048),
    publicId: z
      .string()
      .trim()
      .min(1, "Upload a background image first.")
      .max(200)
      .regex(
        /^alliance-sourcing-bd\/banners\/[A-Za-z0-9_-]{8,64}$/,
        "That image was not uploaded from the banner editor.",
      ),
  })
  .refine(
    ({ imageUrl, publicId }) => {
      try {
        const url = new URL(imageUrl);
        if (url.protocol !== "https:") return false;
        if (url.hostname !== "res.cloudinary.com") return false;

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        if (cloudName && !url.pathname.startsWith(`/${cloudName}/image/upload/`)) {
          return false;
        }

        // The delivered URL must actually be the asset named by publicId.
        return decodeURIComponent(url.pathname).includes(publicId);
      } catch {
        return false;
      }
    },
    {
      message:
        "That image reference does not match a banner upload. Upload the background through this page.",
    },
  );

export const bannerCreateSchema = z.object({
  ...bannerFields,
  image: bannerImageReferenceSchema,
});

/**
 * A patch may omit the image entirely so that text-only edits keep the
 * currently saved background. When an image is supplied it must be a complete,
 * freshly uploaded reference.
 */
export const bannerUpdateSchema = z
  .object({
    ...bannerFields,
    image: bannerImageReferenceSchema.optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update.",
  });

export const bannerOrderSchema = z.object({
  ids: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid banner id."))
    .min(1, "Send at least one banner id.")
    .max(200, "Too many banner ids in one request."),
});

export const BANNER_ID_PATTERN = /^[a-f\d]{24}$/i;
