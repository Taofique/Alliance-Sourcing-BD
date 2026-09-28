import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { bannerOrderSchema } from "@/lib/validations/banner";
import { reorderBanners } from "@/services/banners";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const unauthorized = await rejectUnauthorizedAdminWrite(request);
    if (unauthorized) return unauthorized;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = bannerOrderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid banner order." },
        { status: 400 },
      );
    }

    if (new Set(parsed.data.ids).size !== parsed.data.ids.length) {
      return Response.json(
        { message: "Each banner may appear only once." },
        { status: 400 },
      );
    }

    const reordered = await reorderBanners(parsed.data.ids);

    if (!reordered) {
      return Response.json(
        { message: "One or more banners no longer exist. Reload and try again." },
        { status: 409 },
      );
    }

    return Response.json({ message: "Banner order saved." });
  } catch (error) {
    console.error("Banner reorder failed", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });
    return Response.json(
      { message: "Unable to save the new order. Please try again." },
      { status: 500 },
    );
  }
}
