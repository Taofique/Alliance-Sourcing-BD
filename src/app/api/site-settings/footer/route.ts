import { readJsonBody, rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { footerUpdateSchema } from "@/lib/validations/footer";
import { updateSiteFooter } from "@/services/site-settings";
import type { SiteFooter } from "@/types/site-settings";

export const runtime = "nodejs";

/**
 * Saves the footer only. The write targets the `footer` sub-document, so
 * contact details, logos, banners and the footer CTA are all left untouched
 * even if this request is replayed or the form is stale.
 */
export async function PATCH(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = footerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid footer details." },
        { status: 400 },
      );
    }

    const footer: SiteFooter = {
      brandDescription: parsed.data.brandDescription,
      address: parsed.data.address,
      emails: parsed.data.emails,
      quickLinks: parsed.data.quickLinks,
      socials: parsed.data.socials,
      whatsappNumber: parsed.data.whatsappNumber,
      whatsappMessage: parsed.data.whatsappMessage,
      copyrightOwner: parsed.data.copyrightOwner,
      legalLinks: parsed.data.legalLinks,
      attribution: parsed.data.attribution,
    };

    const updated = await updateSiteFooter(footer);

    if (!updated) {
      return Response.json(
        { message: "Site settings were not found." },
        { status: 404 },
      );
    }

    return Response.json({ message: "Footer saved." });
  } catch (error) {
    console.error("Footer settings update failed:", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      { message: "Unable to save the footer. Please try again." },
      { status: 500 },
    );
  }
}
