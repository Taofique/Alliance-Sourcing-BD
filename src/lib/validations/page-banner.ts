import { z } from "zod";
import { PAGE_BANNER_FOLDER } from "@/lib/page-banner-defaults";

/**
 * Only images uploaded through a page-banner editor may be stored, so a section
 * can never be pointed at an arbitrary remote asset. The bundled photograph in
 * `lib/page-banner-defaults.ts` is not a stored image — it is a rendering
 * fallback for when `image` is null.
 *
 * The check is the same shape as the footer-CTA one, pointed at its own
 * Cloudinary folder so a footer-CTA or homepage-banner upload can never be saved
 * as a page banner (or the other way round).
 */
const pageBannerImageSchema = z
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
        new RegExp(`^${PAGE_BANNER_FOLDER}/[A-Za-z0-9_-]{8,64}$`),
        "That image was not uploaded from the page banner editor.",
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
        "That image reference does not match a page banner upload. Upload the background through this page.",
    },
  );

export const pageBannerUpdateSchema = z.object({
  /**
   * Required, but nullable: `null` clears the stored image and returns the
   * section to the bundled cover photograph.
   *
   * This is deliberately NOT optional. The admin form always sends the
   * effective image, so an omitted key can only mean a malformed request — and
   * because the write is a targeted `$set`, previously an empty body was
   * accepted as a no-op and still answered "saved and live", hiding the fact
   * that nothing had been stored. Rejecting it keeps the success message
   * meaningful.
   */
  image: pageBannerImageSchema.nullable(),
});

export type PageBannerUpdateInput = z.infer<typeof pageBannerUpdateSchema>;

/**
 * The page cover photographs reuse the established wide-image profile: the same
 * 2 MiB ceiling, static-format allowlist and bounded downscale-to-2560px
 * processor the banner and footer-CTA backgrounds use.
 */
export {
  MAX_BANNER_BYTES as PAGE_BANNER_MAX_BYTES,
  BANNER_ACCEPT as PAGE_BANNER_ACCEPT,
  BANNER_SIZE_MESSAGE as PAGE_BANNER_SIZE_MESSAGE,
} from "@/lib/banner-upload-limits";
