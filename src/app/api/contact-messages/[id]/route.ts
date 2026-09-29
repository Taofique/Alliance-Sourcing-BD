import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { contactMessageUpdateSchema } from "@/lib/validations/contact-message";
import {
  deleteContactMessage,
  markContactMessageRead,
} from "@/services/contact-message";
import { CONTACT_MESSAGE_ID_PATTERN } from "@/types/contact-message";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/**
 * Writes only. The inbox itself is read by the admin page calling the service, in
 * the same way the FAQ editor reads its list, so there is no GET route here: a
 * browser GET carries no `origin` header and could not pass the write
 * authorization anyway.
 */

/** Marks a message read or unread. The only thing that can be changed. */
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!CONTACT_MESSAGE_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid message ID." }, { status: 400 });
    }
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = contactMessageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid update." }, { status: 400 });
    }
    const message = await markContactMessageRead(id, parsed.data.isRead);
    if (!message) {
      return Response.json(
        { message: "Message no longer exists. Reload the page." },
        { status: 404 },
      );
    }
    return Response.json({ message: "Message updated.", contactMessage: message });
  } catch {
    return Response.json(
      { message: "Unable to update the message. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, {
      requireJson: false,
    });
    if (denied) return denied;
    const { id } = await params;
    if (!CONTACT_MESSAGE_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid message ID." }, { status: 400 });
    }
    if (!(await deleteContactMessage(id))) {
      return Response.json(
        { message: "Message no longer exists. Reload the page." },
        { status: 404 },
      );
    }
    return Response.json({ message: "Message deleted." });
  } catch {
    return Response.json(
      { message: "Unable to delete the message. Please try again." },
      { status: 500 },
    );
  }
}
