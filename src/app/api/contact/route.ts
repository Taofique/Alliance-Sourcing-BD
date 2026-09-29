import { readJsonBody } from "@/lib/admin-api";
import {
  contactHoneypotSchema,
  contactMessageCreateSchema,
} from "@/lib/validations/contact-message";
import { createContactMessage } from "@/services/contact-message";
export const runtime = "nodejs";

const ACCEPTED = { message: "Thank you! Your message has been sent." };

/**
 * Receives a message from the /contact form.
 *
 * The one public write in the project: a visitor with no session has to be able
 * to reach it, so it authorizes on the shape of the request rather than on a
 * cookie. Three things keep that from becoming an open relay — the body must be
 * JSON, the hidden `website` field must be empty, and every field is length-capped
 * and, for the address, format-checked.
 */
export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "Send JSON data." }, { status: 415 });
    }

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const honeypot = contactHoneypotSchema.safeParse(body);
    if (!honeypot.success) {
      return Response.json({ message: "Check the form." }, { status: 400 });
    }
    if (honeypot.data.website?.trim()) {
      return Response.json(ACCEPTED, { status: 201 });
    }

    // The trap is dropped before the strict schema runs, or its key would be
    // reported as an unexpected field on an otherwise perfect submission.
    const fields = { ...honeypot.data };
    delete fields.website;

    const parsed = contactMessageCreateSchema.safeParse(fields);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Check the form." },
        { status: 400 },
      );
    }

    await createContactMessage(parsed.data);

    return Response.json(ACCEPTED, { status: 201 });
  } catch {
    return Response.json(
      {
        message:
          "We could not send that just now. Please try again, or email us directly.",
      },
      { status: 500 },
    );
  }
}
