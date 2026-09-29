import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { contactCardMergedSchema } from "@/lib/validations/contact-card";
import { ContactCardModel } from "@/models/contact-card";
import type {
  AdminContactCard,
  ContactCard,
  ContactCardInput,
} from "@/types/contact-card";

const CARD_SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;

type CardDoc = {
  _id: Types.ObjectId;
  type: ContactCardInput["type"];
  label: string;
  description: string;
  values: ContactCardInput["values"];
  action: ContactCardInput["action"];
  iconKey: ContactCardInput["iconKey"];
  mapEmbedUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toCard(record: CardDoc): ContactCard {
  return {
    id: record._id.toString(),
    type: record.type,
    label: record.label,
    description: record.description ?? "",
    values: (record.values ?? []).map((value) => ({
      text: value.text,
      href: value.href ?? null,
    })),
    action: record.action ?? null,
    iconKey: record.iconKey,
    mapEmbedUrl: record.mapEmbedUrl ?? "",
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function toAdmin(record: CardDoc): AdminContactCard {
  return {
    ...toCard(record),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The boxes the /contact grid shows: active cards only, in published order.
 *
 * A Server Component never calls our own API, so the page reads the collection
 * straight through this function. The list may be any length — one card, three
 * cards, none at all — and the grid renders whatever it is given. An empty result
 * is a normal state, not an error.
 */
export async function getPublicContactCards(): Promise<ContactCard[]> {
  await connectDB();
  const records = await ContactCardModel.find({ isActive: true })
    .sort(CARD_SORT)
    .lean();

  return records.map((record) => toCard(record as unknown as CardDoc));
}

/* -------------------------------------------------------------------------- */
/*  Admin read                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Every card for the admin editor, published order first but including the
 * inactive ones so a hidden card can still be found, re-ordered and restored.
 */
export async function getAdminContactCards(): Promise<AdminContactCard[]> {
  await connectDB();
  const records = await ContactCardModel.find({}).sort(CARD_SORT).lean();

  return records.map((record) => toAdmin(record as unknown as CardDoc));
}

/* -------------------------------------------------------------------------- */
/*  Admin writes                                                              */
/* -------------------------------------------------------------------------- */

export async function createContactCard(
  input: ContactCardInput,
): Promise<AdminContactCard> {
  await connectDB();
  const created = await ContactCardModel.create(input);

  return toAdmin(created.toObject() as unknown as CardDoc);
}

/**
 * Applies a partial change to an existing card.
 *
 * The merged record is re-validated, so an update cannot leave a card with no
 * description, values or action — a combination the create schema forbids.
 * Returns `null` when the id does not exist or the merge fails those rules.
 */
export async function updateContactCard(
  id: string,
  changes: Partial<ContactCardInput>,
): Promise<AdminContactCard | null> {
  await connectDB();

  const existing = await ContactCardModel.findById(id).lean();
  if (!existing) return null;

  const current = toCard(existing as unknown as CardDoc);
  const merged = contactCardMergedSchema.safeParse({ ...current, ...changes });
  if (!merged.success) return null;

  const record = await ContactCardModel.findByIdAndUpdate(
    id,
    { $set: merged.data },
    { new: true, runValidators: true },
  ).lean();

  return record ? toAdmin(record as unknown as CardDoc) : null;
}

export async function deleteContactCard(id: string): Promise<boolean> {
  await connectDB();
  return (await ContactCardModel.deleteOne({ _id: id })).deletedCount === 1;
}

/**
 * Saves a new display order.
 *
 * The submitted ids must be exactly the ids that exist right now: a stale list
 * would otherwise silently drop a card that was created or deleted in another
 * tab, so the caller gets `null` and is told to reload.
 */
export async function reorderContactCards(
  ids: string[],
): Promise<AdminContactCard[] | null> {
  await connectDB();

  const existing = await ContactCardModel.find({}).select("_id").lean();
  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await ContactCardModel.bulkWrite(
    ids.map((id, sortOrder) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder } } },
    })),
  );
  if (result.matchedCount !== ids.length) {
    return null;
  }

  return getAdminContactCards();
}
