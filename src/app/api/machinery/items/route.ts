import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { MACHINERY_ID_PATTERN, machineryItemCreateSchema } from "@/lib/validations/machinery";
import {
  createMachineryItem,
  getAdminMachineryItems,
} from "@/services/machinery";
export const runtime = "nodejs";
/** `?categoryId=` narrows the list, which is what the admin filter uses. */
export async function GET(request: Request) {
  try {
    const categoryId = new URL(request.url).searchParams.get("categoryId");
    if (categoryId && !MACHINERY_ID_PATTERN.test(categoryId)) {
      return Response.json({ message: "Invalid category filter." }, { status: 400 });
    }
    return Response.json({ items: await getAdminMachineryItems(categoryId ?? undefined) });
  } catch {
    return Response.json({ message: "Unable to load the machines." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = machineryItemCreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid machine." }, { status: 400 });
    const item = await createMachineryItem(parsed.data);
    // A machine in a category that is not there can never be published.
    if (!item) return Response.json({ message: "That category no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Machine added.", item }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to add the machine. Please try again." }, { status: 500 });
  }
}
