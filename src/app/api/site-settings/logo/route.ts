import { getAdminSession } from "@/lib/admin-session";
import { uploadLogo } from "@/lib/cloudinary";
import { readLogoFormData } from "@/lib/logo-form-data";
import { normalizeLogo } from "@/lib/logo-image";
import { ImageInputError } from "@/lib/image-safety";
import { siteLogoExists, updateSiteLogo } from "@/services/site-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let stage = "authentication";
  try {
    if (!await getAdminSession()) return Response.json({ message: "Admin authentication required." }, { status: 401 });
    const baseURL = process.env.BETTER_AUTH_URL;
    if (!baseURL) throw new Error("Application origin is missing.");
    if (request.headers.get("origin") !== new URL(baseURL).origin) return Response.json({ message: "Request origin is not allowed." }, { status: 403 });
    stage = "validation";
    const { file, logoKey } = await readLogoFormData(request);
    if (!await siteLogoExists(logoKey)) return Response.json({ message: "Site settings or the selected logo were not found." }, { status: 404 });
    const png = await normalizeLogo(Buffer.from(await file.arrayBuffer()));
    stage = "upload";
    const image = await uploadLogo(png);
    stage = "database";
    if (!await updateSiteLogo(logoKey, image)) {
      console.error("Logo database update matched no record after upload; asset retained.");
      return Response.json({ message: "The selected logo no longer exists. The uploaded asset was retained." }, { status: 409 });
    }
    return Response.json({ message: "Logo saved successfully.", imageUrl: image.imageUrl });
  } catch (error) {
    if (error instanceof ImageInputError) return Response.json({ message: error.message }, { status: error.status });
    // Never log raw SDK/database errors that may contain credentials.
    console.error("Logo replacement failed", { stage, errorType: error instanceof Error ? error.name : "Unknown" });
    const message = stage === "database"
      ? "Upload completed but saving could not be confirmed. Reload settings before retrying. The uploaded asset was retained."
      : "Unable to replace the logo. Please try again.";
    return Response.json({ message }, { status: stage === "upload" ? 502 : 500 });
  }
}
