import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { sourcingCreateSchema } from "@/lib/validations/sourcing";
import { createSourcingCategory } from "@/services/sourcing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = sourcingCreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
    const { image, ...fields } = parsed.data;
    const category = await createSourcingCategory(fields, image);
    return Response.json({ message: "Category created.", category }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return Response.json({ message: "A category with this title already exists. Edit it or choose a different title." }, { status: 409 });
    }
    return Response.json({ message: "Unable to create the category. Please try again." }, { status: 500 });
  }
}

