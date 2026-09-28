import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { sourcingSettingsSchema } from "@/lib/validations/sourcing";
import { saveSourcingSettings } from "@/services/sourcing";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = sourcingSettingsSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
    const settings = await saveSourcingSettings(parsed.data);
    return Response.json({ message: "Section settings saved.", settings });
  } catch {
    return Response.json({ message: "Unable to save section settings. Please try again." }, { status: 500 });
  }
}

