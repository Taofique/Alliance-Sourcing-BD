import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { bannerCreateSchema } from "@/lib/validations/banner";
import { createBanner } from "@/services/banners";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const unauthorized = await rejectUnauthorizedAdminWrite(request);
    if (unauthorized) return unauthorized;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = bannerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid banner." },
        { status: 400 },
      );
    }

    const { image, ...fields } = parsed.data;

    const banner = await createBanner(fields, image);

    return Response.json(
      { message: "Banner created.", banner },
      { status: 201 },
    );
  } catch (error) {
    // Database errors can contain connection strings; log the type only.
    console.error(
      "Banner creation failed",
      { errorType: error instanceof Error ? error.name : "Unknown" },
    );
    return Response.json(
      { message: "Unable to create the banner. Please try again." },
      { status: 500 },
    );
  }
}
