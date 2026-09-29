import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import type { ContactMessageInput } from "@/types/contact-message";

export type ContactMessageRecord = ContactMessageInput & {
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * One enquiry sent from /contact.
 *
 * The submitted text is stored as sent and is only ever rendered inside the
 * admin, which escapes it. The indexes serve the two reads that exist: the admin
 * inbox, newest first, and the unread count on the dashboard.
 */
const contactMessageSchema = new Schema<ContactMessageRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: "contact_messages" },
);

contactMessageSchema.index({ isRead: 1, createdAt: -1, _id: -1 });

export const ContactMessageModel =
  (models.ContactMessage as Model<ContactMessageRecord> | undefined) ??
  model<ContactMessageRecord>("ContactMessage", contactMessageSchema);
