import "server-only";

import { getAdminSession } from "@/lib/admin-session";

/**
 * Every cookie-authenticated write authorizes independently: an admin session
 * plus an exact match against our own application origin.
 *
 * Returns a ready-to-return error Response, or null when the request may
 * proceed. Callers must check this before reading any request body.
 *
 * `requireJson` only applies to methods that carry a body; a DELETE sent by the
 * browser has no body and therefore no content type.
 */
export async function rejectUnauthorizedAdminWrite(
  request: Request,
  { requireJson = true }: { requireJson?: boolean } = {},
): Promise<Response | null> {
  if (!(await getAdminSession())) {
    return Response.json(
      { message: "Admin authentication required." },
      { status: 401 },
    );
  }

  const baseURL = process.env.BETTER_AUTH_URL;

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is missing.");
  }

  if (request.headers.get("origin") !== new URL(baseURL).origin) {
    return Response.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  if (requireJson && !request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ message: "Send JSON data." }, { status: 415 });
  }

  return null;
}

export async function readJsonBody(request: Request) {
  try {
    return { body: (await request.json()) as unknown, error: null };
  } catch {
    return { body: null, error: Response.json({ message: "Invalid JSON." }, { status: 400 }) };
  }
}
