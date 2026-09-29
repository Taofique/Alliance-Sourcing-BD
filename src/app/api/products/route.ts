import { getProductCatalog } from "@/services/products";

export const runtime = "nodejs";

/**
 * The published catalogue, as a JSON read for anything that needs it outside the
 * page itself.
 *
 * This is a public read, so it carries no admin session check: the service has
 * already reduced the result to the active, non-empty branches, which is exactly
 * what a visitor is allowed to see. The /buying-house page does not use this
 * route — it reads the service directly, because a Server Component should not
 * call its own API — but it keeps the data available to other consumers.
 */
export async function GET() {
  try {
    return Response.json(await getProductCatalog());
  } catch {
    return Response.json(
      { message: "Unable to load the product catalogue." },
      { status: 500 },
    );
  }
}
