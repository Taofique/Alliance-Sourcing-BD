import { z } from "zod";
import { CONTACT_MESSAGE_ID_PATTERN } from "@/types/contact-message";

const fields = {
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
  email: z.string().trim().email("Enter a valid email.").max(254),
  subject: z
    .string()
    .trim()
    .min(1, "Enter a subject.")
    .max(150, "Keep the subject under 150 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — 10 characters or more.")
    .max(4000, "Keep the message under 4000 characters."),
};

export const contactMessageCreateSchema = z.object(fields).strict();

/**
 * Just the hidden field, read on its own and before anything else.
 *
 * It is checked separately so that a submission which trips the trap is answered
 * with a plain success even if the rest of its fields are junk — the trap should
 * not tell a bot which of its fields were wrong.
 */
export const contactHoneypotSchema = z
  .object({ website: z.string().optional() })
  .passthrough();

export const contactMessageUpdateSchema = z
  .object({ isRead: z.boolean() })
  .strict();

export const contactMessageIdSchema = z
  .string()
  .regex(CONTACT_MESSAGE_ID_PATTERN, "Invalid message ID.");
