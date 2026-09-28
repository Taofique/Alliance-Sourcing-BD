import { z } from "zod";
import { FOOTER_SOCIAL_PLATFORMS } from "@/types/site-settings";
import { isAllowedHref, HREF_MESSAGE } from "@/lib/validations/safe-href";

const MAX_DESCRIPTION = 400;
const MAX_ADDRESS = 300;
const MAX_LABEL = 60;
const MAX_MESSAGE = 300;
const MAX_OWNER = 120;

const hrefField = z
  .string()
  .trim()
  .min(1, "Enter a destination.")
  .max(2048, "That destination is too long.")
  .refine(isAllowedHref, { message: HREF_MESSAGE });

/** Editor-generated ids, never trusted from anywhere else. */
const linkIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]{1,64}$/, "Invalid link id.");

const linkSchema = z.object({
  id: linkIdSchema,
  label: z
    .string()
    .trim()
    .min(1, "Enter a label.")
    .max(MAX_LABEL, `Use ${MAX_LABEL} characters or fewer.`),
  href: hrefField,
});

const linkListSchema = z
  .array(linkSchema)
  .max(20, "A maximum of 20 links is allowed.")
  .superRefine((links, ctx) => {
    const ids = new Set<string>();
    for (const link of links) {
      if (ids.has(link.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Every link needs its own id.",
        });
        return;
      }
      ids.add(link.id);
    }
  });

/**
 * Exactly one international number, in E.164 digits. Spaces, dashes, dots and
 * brackets are accepted for readability and stripped before the link is built.
 */
const WHATSAPP_MESSAGE =
  "Use one international number in +country code form, for example +8801712345678.";

const whatsappSchema = z
  .string()
  .trim()
  // A generous bound purely to cap payload size. The refine below is what
  // actually enforces the shape, and it reports the same message either way, so
  // pasting two numbers never surfaces a confusing "too long" complaint.
  .max(64, WHATSAPP_MESSAGE)
  .refine(
    (value) => {
      if (!value) return true;
      const digits = value.replace(/[\s()-]/g, "");
      return /^\+[1-9]\d{7,14}$/.test(digits);
    },
    { message: WHATSAPP_MESSAGE },
  );

const emailListSchema = z
  .array(z.string().trim().email("Enter a valid email.").max(254))
  .max(10, "A maximum of 10 emails is allowed.")
  .refine(
    (emails) =>
      new Set(emails.map((email) => email.toLowerCase())).size === emails.length,
    "Use each address only once.",
  );

export const footerUpdateSchema = z.object({
  brandDescription: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION, `Use ${MAX_DESCRIPTION} characters or fewer.`)
    .default(""),
  address: z
    .string()
    .trim()
    .max(MAX_ADDRESS, `Use ${MAX_ADDRESS} characters or fewer.`)
    .default(""),
  emails: emailListSchema.default([]),
  quickLinks: linkListSchema.default([]),
  socials: z
    .array(
      z.object({
        platform: z.enum(FOOTER_SOCIAL_PLATFORMS),
        href: hrefField,
      }),
    )
    .max(FOOTER_SOCIAL_PLATFORMS.length, "Too many social links.")
    .superRefine((socials, ctx) => {
      const seen = new Set<string>();
      for (const social of socials) {
        if (seen.has(social.platform)) {
          ctx.addIssue({
            code: "custom",
            message: "Each social platform can only be linked once.",
          });
          return;
        }
        seen.add(social.platform);
      }
    })
    .default([]),
  whatsappNumber: whatsappSchema.default(""),
  whatsappMessage: z
    .string()
    .trim()
    .max(MAX_MESSAGE, `Use ${MAX_MESSAGE} characters or fewer.`)
    .default(""),
  copyrightOwner: z
    .string()
    .trim()
    .max(MAX_OWNER, `Use ${MAX_OWNER} characters or fewer.`)
    .default(""),
  legalLinks: linkListSchema.default([]),
  attribution: linkSchema.nullable().default(null),
});

export type FooterUpdateInput = z.infer<typeof footerUpdateSchema>;

export const MAX_CTA_HEADING = 160;
export const MAX_CTA_DESCRIPTION = 600;
export const MAX_CTA_BUTTON = 60;

/**
 * Only images this app uploaded into the dedicated Cloudinary footer-CTA
 * folder may be stored, so the section can never be pointed at an arbitrary
 * asset. The local default in `lib/footer-defaults.ts` is not a stored image —
 * it is only used while `image` is null.
 */
const ctaImageSchema = z
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
        /^alliance-sourcing-bd\/footer-cta\/[A-Za-z0-9_-]{8,64}$/,
        "That image was not uploaded from the footer CTA editor.",
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

        return decodeURIComponent(url.pathname).includes(publicId);
      } catch {
        return false;
      }
    },
    {
      message:
        "That image reference does not match a footer CTA upload. Upload the background through this page.",
    },
  );

export const footerCtaUpdateSchema = z.object({
  enabled: z.boolean(),
  heading: z
    .string()
    .trim()
    .min(1, "Enter a heading.")
    .max(MAX_CTA_HEADING, `Use ${MAX_CTA_HEADING} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(MAX_CTA_DESCRIPTION, `Use ${MAX_CTA_DESCRIPTION} characters or fewer.`)
    .default(""),
  buttonText: z
    .string()
    .trim()
    .min(1, "Enter a button label.")
    .max(MAX_CTA_BUTTON, `Use ${MAX_CTA_BUTTON} characters or fewer.`),
  buttonHref: hrefField,
  /**
   * `null` clears a stored image and returns the section to the bundled default
   * photograph; omitting the key entirely keeps whatever is already saved, so a
   * text-only edit can never drop the background.
   */
  image: ctaImageSchema.nullable().optional(),
});

export type FooterCtaUpdateInput = z.infer<typeof footerCtaUpdateSchema>;

/**
 * The footer CTA background reuses the established wide-image profile: the same
 * 2 MiB ceiling, the same static-format allowlist and the same bounded
 * downscale-to-2560px processor the banner backgrounds use.
 */
export {
  MAX_BANNER_BYTES as FOOTER_CTA_MAX_BYTES,
  BANNER_ACCEPT as FOOTER_CTA_ACCEPT,
  BANNER_SIZE_MESSAGE as FOOTER_CTA_SIZE_MESSAGE,
} from "@/lib/banner-upload-limits";

