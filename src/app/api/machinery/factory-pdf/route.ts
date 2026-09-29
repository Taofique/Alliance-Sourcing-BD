import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { factoryPdfSaveSchema } from "@/lib/validations/machinery";
import { getFactoryPdf, saveFactoryPdf } from "@/services/machinery";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json({ pdf: await getFactoryPdf() });
  } catch {
    return Response.json(
      { message: "Unable to load the document." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    /*
     * `pdf` is required but nullable on purpose. An empty body would mean
     * "no change", and answering that with a success message is what makes a
     * save look like it worked when it stored nothing.
     */
    if (typeof body !== "object" || body === null || !("pdf" in body)) {
      return Response.json(
        { message: "No document was supplied. Upload a PDF, or remove the current one." },
        { status: 400 },
      );
    }
    const parsed = factoryPdfSaveSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid document." }, { status: 400 });
    const pdf = await saveFactoryPdf(parsed.data.pdf);
    revalidatePath("/factory-machinery");
    return Response.json({ message: pdf ? "Document saved." : "Document removed.", pdf });
  } catch {
    return Response.json({ message: "Unable to save the document. Please try again." }, { status: 500 });
  }
}
