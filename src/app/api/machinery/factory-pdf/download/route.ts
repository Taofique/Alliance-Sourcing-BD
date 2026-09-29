import { getFactoryPdf } from "@/services/machinery";
import { factoryPdfDeliveryUrl } from "@/lib/cloudinary";
import { attachmentDisposition } from "@/lib/content-disposition";
export const runtime = "nodejs";

/**
 * GET /api/machinery/factory-pdf/download
 *
 * Re-serves the stored factory profile as an attachment.
 *
 * The page's own Download button could not do this. Browsers ignore the
 * `download` attribute on a cross-origin link, and Cloudinary delivers a raw
 * asset as `inline`, so pointing straight at the file opened the document in a
 * tab rather than saving it. Serving it from our own origin is what makes the
 * download real, and it is the only place the stored file name — spaces and all
 * — can be set in the header.
 *
 * Public on purpose: it is a brochure, the page carrying the button is public,
 * and there is nothing here that a signed url would protect, since the asset
 * is reachable through Cloudinary either way.
 */
export async function GET(request: Request) {
  const pdf = await getFactoryPdf();

  if (!pdf) {
    return Response.json(
      { message: "No factory profile is published." },
      { status: 404 },
    );
  }

  const range = request.headers.get("range");
  let upstream: Response;

  try {
    upstream = await fetch(factoryPdfDeliveryUrl(pdf.publicId), {
      // A range header is forwarded so a viewer seeking through the document is
      // not made to download all of it again; Cloudinary answers 206 or 200.
      headers: range ? { range } : {},
      // The document is replaceable, so a copy held anywhere in between must
      // not outlive the one it was taken from.
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { message: "The document is temporarily unavailable." },
      { status: 502 },
    );
  }

  if (!upstream.ok && upstream.status !== 206) {
    return Response.json(
      { message: "The document is temporarily unavailable." },
      { status: 502 },
    );
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": attachmentDisposition(pdf.fileName),
    "Cache-Control": "no-cache, must-revalidate",
  });

  for (const header of [
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
