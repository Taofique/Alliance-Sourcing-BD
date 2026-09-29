import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { productCreateSchema } from "@/lib/validations/products";
import { createProduct, getAdminProducts } from "@/services/products";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const subcategoryId =
      new URL(request.url).searchParams.get("subcategoryId") ?? undefined;
    return Response.json({ products: await getAdminProducts(subcategoryId) });
  } catch {
    return Response.json(
      { message: "Unable to load the products." },
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

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid product." },
        { status: 400 },
      );
    }

    const product = await createProduct(parsed.data);
    if (!product) {
      return Response.json(
        { message: "That subcategory no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Product created.", product }, { status: 201 });
  } catch {
    return Response.json(
      { message: "Unable to create the product. Please try again." },
      { status: 500 },
    );
  }
}
