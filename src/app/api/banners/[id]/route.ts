import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { BANNER_ID_PATTERN, bannerUpdateSchema } from "@/lib/validations/banner";
import { deleteBanner, updateBanner } from "@/services/banners";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const invalidIdResponse = () =>
  Response.json({ message: "Invalid banner id." }, { status: 400 });

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const unauthorized = await rejectUnauthorizedAdminWrite(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    if (!BANNER_ID_PATTERN.test(id)) return invalidIdResponse();

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = bannerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid banner." },
        { status: 400 },
      );
    }

    const { image, ...fields } = parsed.data;
    const banner = await updateBanner(id, image ? { ...fields, image } : fields);

    if (!banner) {
      return Response.json({ message: "Banner not found." }, { status: 404 });
    }

    return Response.json({ message: "Banner saved.", banner });
  } catch (error) {
    console.error("Banner update failed", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });
    return Response.json(
      { message: "Unable to save the banner. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    // A browser DELETE carries no body, so only auth and origin apply here.
    const unauthorized = await rejectUnauthorizedAdminWrite(request, {
      requireJson: false,
    });
    if (unauthorized) return unauthorized;

    const { id } = await params;
    if (!BANNER_ID_PATTERN.test(id)) return invalidIdResponse();

    const deleted = await deleteBanner(id);

    if (!deleted) {
      return Response.json({ message: "Banner not found." }, { status: 404 });
    }

    return Response.json({ message: "Banner deleted." });
  } catch (error) {
    console.error("Banner deletion failed", {
      errorType: error instanceof Error ? error.name : "Unknown",
    });
    return Response.json(
      { message: "Unable to delete the banner. Please try again." },
      { status: 500 },
    );
  }
}
