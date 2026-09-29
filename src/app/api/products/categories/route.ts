import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { productCategoryCreateSchema } from "@/lib/validations/products";
import { describeProductDuplicate } from "@/lib/product-duplicate";
import {
  createProductCategory,
  getAdminProductCategories,
} from "@/services/products";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ categories: await getAdminProductCategories() });
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

    const parsed = productCategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid category." },
        { status: 400 },
      );
    }

    const category = await createProductCategory(parsed.data);
    revalidatePath("/buying-house");
    return Response.json({ message: "Category created.", category }, { status: 201 });
  } catch (error) {
    const duplicate = describeProductDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json(
      { message: "Unable to create the category. Please try again." },
      { status: 500 },
    );
  }
}
