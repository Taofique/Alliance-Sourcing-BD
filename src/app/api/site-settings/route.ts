import { getAdminSession } from "@/lib/admin-session";
import { contactUpdateSchema } from "@/lib/validations/site-settings";
import { updateSiteContact } from "@/services/site-settings";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return Response.json(
        { message: "Admin authentication required." },
        { status: 401 },
      );
    }

    const baseURL = process.env.BETTER_AUTH_URL;

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is missing.");
    }

    // Cookie-authenticated writes must come from our own website.
    if (request.headers.get("origin") !== new URL(baseURL).origin) {
      return Response.json(
        { message: "Request origin is not allowed." },
        { status: 403 },
      );
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "Send JSON data." }, { status: 415 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Invalid JSON." }, { status: 400 });
    }

    const parsed = contactUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Invalid contact details.",
        },
        { status: 400 },
      );
    }

    const contact = {
      phones: parsed.data.phones.map(({ label }) => ({
        label,
        href: `tel:${label.replace(/[^\d+]/g, "")}`,
      })),
      topBarEmails: parsed.data.topBarEmails,
    };

    const updated = await updateSiteContact(contact);

    if (!updated) {
      return Response.json(
        { message: "Site settings were not found." },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Contact details saved.",
    });
  } catch (error) {
    console.error("Contact settings update failed:", error);

    return Response.json(
      { message: "Unable to save settings. Please try again." },
      { status: 500 },
    );
  }
}
