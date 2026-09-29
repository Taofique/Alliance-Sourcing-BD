import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ContactMessageModel } from "@/models/contact-message";
import type {
  AdminContactMessage,
  ContactMessageInput,
} from "@/types/contact-message";

const INBOX_SORT = { createdAt: -1, _id: -1 } as const;

type MessageDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toAdmin(record: MessageDoc): AdminContactMessage {
  return {
    id: record._id.toString(),
    name: record.name,
    email: record.email,
    subject: record.subject,
    message: record.message,
    isRead: record.isRead,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Stores a message from the public form.
 *
 * Called only after the honeypot and the schema have both passed, so what lands
 * here has already been length-capped and had its email address checked.
 */
export async function createContactMessage(
  input: ContactMessageInput,
): Promise<AdminContactMessage> {
  await connectDB();
  const created = await ContactMessageModel.create(input);

  return toAdmin(created.toObject() as unknown as MessageDoc);
}

/**
 * The whole inbox, newest first, read and unread alike — an editor filters by eye
 * and marking read is what removes something from their list of things to do.
 */
export async function getContactMessages(): Promise<AdminContactMessage[]> {
  await connectDB();
  const records = await ContactMessageModel.find({}).sort(INBOX_SORT).lean();

  return records.map((record) => toAdmin(record as unknown as MessageDoc));
}

/** How many messages are still waiting to be read, for the admin nav badge. */
export async function countUnreadContactMessages(): Promise<number> {
  await connectDB();

  return ContactMessageModel.countDocuments({ isRead: false });
}

export async function markContactMessageRead(
  id: string,
  isRead: boolean,
): Promise<AdminContactMessage | null> {
  await connectDB();
  const record = await ContactMessageModel.findByIdAndUpdate(
    id,
    { $set: { isRead } },
    { new: true },
  ).lean();

  return record ? toAdmin(record as unknown as MessageDoc) : null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  await connectDB();
  return (await ContactMessageModel.deleteOne({ _id: id })).deletedCount === 1;
}
