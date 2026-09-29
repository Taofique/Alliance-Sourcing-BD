import { rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { ImageInputError } from "@/lib/image-safety";
import { uploadFactoryPdf } from "@/lib/cloudinary";
import {
  FACTORY_PDF_ACCEPT,
  FACTORY_PDF_SIZE_MESSAGE,
  MAX_FACTORY_PDF_BYTES,
} from "@/lib/validations/machinery";
export const runtime = "nodejs";

/** Strips any path the browser sent and keeps a safe, printable name. */
function safeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  return base.replace(/[^\w.\- ]+/g, "").trim().slice(0, 120) || "factory-profile.pdf";
}

/**
 * Uploads the factory profile PDF and hands the reference back.
 *
 * The record is saved separately, so a failed upload can never replace the
 * document the public page is already serving.
 */
export async function POST(request: Request) {
  let stage = "authentication";

  try {
    // Independent authorization and origin check, before the body is read.
    const denied = await rejectUnauthorizedAdminWrite(request, {
      requireJson: false,
    });
    if (denied) return denied;

    stage = "validation";
    // The bounded multipart reader is shared with the image editors: the
    // streaming ceiling it enforces is what rejects an oversized or dishonest
    // request before anything is decoded.
    const { file } = await readBoundedImageFormData(request, {
      maxBytes: MAX_FACTORY_PDF_BYTES,
      extraFields: [],
      sizeMessage: FACTORY_PDF_SIZE_MESSAGE,
      emptyMessage: "Choose a PDF and try again.",
    });

    if (file.type && file.type !== FACTORY_PDF_ACCEPT) {
      return Response.json(
        { message: "Choose a PDF document." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    /*
     * The declared content type and the filename are both attacker-controlled,
     * so the document is identified by its own leading bytes instead. A PDF
     * always begins with "%PDF-".
     */
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return Response.json(
        { message: "Choose a PDF document." },
        { status: 415 },
      );
    }

    stage = "upload";
    const asset = await uploadFactoryPdf(buffer);

    return Response.json({
      message: "PDF uploaded. Save the document to publish it.",
      pdf: { ...asset, fileName: safeFileName(file.name) },
    });
  } catch (error) {
    if (error instanceof ImageInputError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    // Never log raw SDK errors that may contain credentials.
    console.error("Factory PDF upload failed", {
      stage,
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      {
        message:
          stage === "upload"
            ? "The PDF could not be uploaded. Your saved document is unchanged."
            : "Unable to read that document. Your saved document is unchanged.",
      },
      { status: stage === "upload" ? 502 : 500 },
    );
  }
}
