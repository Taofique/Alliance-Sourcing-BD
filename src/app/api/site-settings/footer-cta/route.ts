import { readJsonBody, rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { footerCtaUpdateSchema } from "@/lib/validations/footer";
import { updateSiteFooterCta } from "@/services/site-settings";

export const runtime = "nodejs";

/**
 * Saves the footer CTA only. The write touches just the `footerCta.*` fields,
 * so the footer, contact details, logos and banners can never be overwritten.
 */
export async function PATCH(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = footerCtaUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Invalid call-to-action details.",
        },
        { status: 400 },
      );
    }

    const updated = await updateSiteFooterCta(
      {
        enabled: parsed.data.enabled,
        heading: parsed.data.heading,
        description: parsed.data.description,
        buttonText: parsed.data.buttonText,
        buttonHref: parsed.data.buttonHref,
      },
      // `undefined` keeps the stored photograph; `null` resets to the default.
      parsed.data.image,
    );

    if (!updated) {
      return Response.json(
        { message: "Site settings were not found." },
        { status: 404 },
      );
    }

    return Response.json({ message: "Call-to-action section saved." });
  } catch (error) {
    console.error("Footer CTA settings update failed:", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      { message: "Unable to save the section. Please try again." },
      { status: 500 },
    );
  }
}
