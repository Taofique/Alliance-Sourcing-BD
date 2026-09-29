import { revalidatePath } from "next/cache";
import { readJsonBody, rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { pageBannerUpdateSchema } from "@/lib/validations/page-banner";
import { isPageBannerSlug } from "@/models/page-banner";
import { updatePageBanner } from "@/services/page-banners";
import { PAGE_BANNER_ROUTES } from "@/lib/page-banner-routes";

export const runtime = "nodejs";

/**
 * Saves one page's cover photograph, in its own `page_banners` document.
 *
 * The write touches nothing else: not the site-wide settings, not the homepage
 * banner carousel, not the footer CTA.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { page } = await params;

    if (!isPageBannerSlug(page)) {
      return Response.json(
        { message: "That page has no banner editor." },
        { status: 404 },
      );
    }

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    /*
     * Checked before Zod purely for the message. `image` is required in the
     * schema, so a body without it fails validation — but Zod v4 reports that
     * as a generic "expected object, received undefined", which tells an
     * editor nothing. Rejecting a no-op explicitly is what stops a request
     * that stored nothing from being answered "saved and live".
     */
    if (typeof body !== "object" || body === null || !("image" in body)) {
      return Response.json(
        {
          message:
            "No image was supplied. Upload a photograph, or save the default.",
        },
        { status: 400 },
      );
    }

    const parsed = pageBannerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Invalid page banner details.",
        },
        { status: 400 },
      );
    }

    const updated = await updatePageBanner(page, parsed.data.image);

    if (!updated) {
      return Response.json(
        { message: "The page banner could not be saved." },
        { status: 500 },
      );
    }

    /*
     * The write is already visible to any fresh render, but Next also keeps a
     * client Router Cache entry per visited route, so a browser that has
     * already been to the page can replay the old banner on the next click.
     * Invalidating the path is what makes the saved photograph appear without
     * the editor needing a hard refresh.
     */
    revalidatePath(PAGE_BANNER_ROUTES[page]);

    return Response.json({ message: "Banner saved." });
  } catch (error) {
    console.error("Page banner update failed:", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      { message: "Unable to save the banner. Please try again." },
      { status: 500 },
    );
  }
}
