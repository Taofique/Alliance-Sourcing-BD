import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { machineryCategoryCreateSchema } from "@/lib/validations/machinery";
import { describeMachineryDuplicate } from "@/lib/machinery-duplicate";
import {
  createMachineryCategory,
  getAdminMachineryCategories,
} from "@/services/machinery";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json({ categories: await getAdminMachineryCategories() });
  } catch {
    return Response.json(
      { message: "Unable to load the categories." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = machineryCategoryCreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
    const category = await createMachineryCategory(parsed.data);
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Category created.", category }, { status: 201 });
  } catch (error) {
    const duplicate = describeMachineryDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json({ message: "Unable to create the category. Please try again." }, { status: 500 });
  }
}
