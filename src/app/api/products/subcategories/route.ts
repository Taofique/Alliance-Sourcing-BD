import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { productSubcategoryCreateSchema } from "@/lib/validations/products";
import { describeProductDuplicate } from "@/lib/product-duplicate";
import {
  createProductSubcategory,
  getAdminProductSubcategories,
} from "@/services/products";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const categoryId = new URL(request.url).searchParams.get("categoryId") ?? undefined;
    return Response.json({ subcategories: await getAdminProductSubcategories(categoryId) });
  } catch {
    return Response.json(
      { message: "Unable to load the subcategories." },
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

    const parsed = productSubcategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid subcategory.",
        },
        { status: 400 },
      );
    }

    const subcategory = await createProductSubcategory(parsed.data);
    if (!subcategory) {
      return Response.json(
        { message: "That category no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json(
      { message: "Subcategory created.", subcategory },
      { status: 201 },
    );
  } catch (error) {
    const duplicate = describeProductDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json(
      { message: "Unable to create the subcategory. Please try again." },
      { status: 500 },
    );
  }
}
