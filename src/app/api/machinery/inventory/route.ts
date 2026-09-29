import { getMachineryInventory } from "@/services/machinery";
export const runtime = "nodejs";

/**
 * The published inventory, grouped by category with every total summed at read
 * time.
 *
 * Public on purpose: it exposes no more than the public page renders, and it
 * lets the inventory be consumed without a Server Component. Totals are computed
 * here rather than stored, so a client can never read a figure that disagrees
 * with the rows it was given.
 */
export async function GET() {
  try {
    return Response.json({ inventory: await getMachineryInventory() });
  } catch {
    return Response.json(
      { message: "Unable to load the machinery inventory." },
      { status: 500 },
    );
  }
}
