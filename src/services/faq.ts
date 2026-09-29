import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { FaqModel } from "@/models/faq";
import type { AdminFaq, Faq, FaqInput } from "@/types/faq";

const FAQ_SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;

type FaqDoc = {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toAdmin(record: FaqDoc): AdminFaq {
  return {
    id: record._id.toString(),
    question: record.question,
    answer: record.answer,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The questions the /global-partners accordion shows: active entries only, in
 * published order.
 *
 * A Server Component never calls our own API, so the page reads the collection
 * straight through this function. An empty list is a normal state, not an error —
 * the page renders no FAQ band at all rather than an empty heading.
 */
export async function getPublicFaqs(): Promise<Faq[]> {
  await connectDB();
  const records = await FaqModel.find({ isActive: true }).sort(FAQ_SORT).lean();

  return records.map((record) => ({
    id: record._id.toString(),
    question: record.question,
    answer: record.answer,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Admin read                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Every entry for the admin editor, published order first but including the
 * inactive ones so a hidden question can still be found, re-ordered and restored.
 */
export async function getAdminFaqs(): Promise<AdminFaq[]> {
  await connectDB();
  const records = await FaqModel.find({}).sort(FAQ_SORT).lean();

  return records.map((record) => toAdmin(record as unknown as FaqDoc));
}

/* -------------------------------------------------------------------------- */
/*  Admin writes                                                              */
/* -------------------------------------------------------------------------- */

export async function createFaq(input: FaqInput): Promise<AdminFaq> {
  await connectDB();
  const created = await FaqModel.create(input);

  return toAdmin(created.toObject() as unknown as FaqDoc);
}

export async function updateFaq(
  id: string,
  changes: Partial<FaqInput>,
): Promise<AdminFaq | null> {
  await connectDB();
  const record = await FaqModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, runValidators: true },
  ).lean();

  return record ? toAdmin(record as unknown as FaqDoc) : null;
}

export async function deleteFaq(id: string): Promise<boolean> {
  await connectDB();
  return (await FaqModel.deleteOne({ _id: id })).deletedCount === 1;
}

/**
 * Saves a new display order.
 *
 * The submitted ids must be exactly the ids that exist right now: a stale list
 * would otherwise silently drop an entry that was created or deleted in another
 * tab, so the caller gets `null` and is told to reload.
 */
export async function reorderFaqs(ids: string[]): Promise<AdminFaq[] | null> {
  await connectDB();

  const existing = await FaqModel.find({}).select("_id").lean();
  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await FaqModel.bulkWrite(
    ids.map((id, sortOrder) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder } } },
    })),
  );
  if (result.matchedCount !== ids.length) {
    return null;
  }

  return getAdminFaqs();
}
