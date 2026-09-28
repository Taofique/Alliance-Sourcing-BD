import "server-only";
import { randomUUID } from "node:crypto";
import { connectDB } from "@/lib/db";
import { defaultSourcingSettings } from "@/lib/sourcing-defaults";
import { SourcingCategoryModel, SourcingSettingsModel, type SourcingCategoryRecord } from "@/models/sourcing";
import type { AdminSourcingCategory, SourcingCategory, SourcingCategoryInput, SourcingImage, SourcingSettings } from "@/types/sourcing";

const SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;
function toAdmin(record: SourcingCategoryRecord & { _id: { toString(): string } }): AdminSourcingCategory {
  return {
    id: record._id.toString(), slug: record.slug, title: record.title,
    description: record.description, imageUrl: record.imageUrl, imageAlt: record.imageAlt,
    publicId: record.publicId ?? null, sortOrder: record.sortOrder, isPublished: record.isPublished,
    createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(),
  };
}
export async function getSourcingCategories(): Promise<SourcingCategory[]> {
  await connectDB();
  const records = await SourcingCategoryModel.find({ isPublished: true }).sort(SORT).lean();
  return records.map(record => ({
    id: record._id.toString(), title: record.title, description: record.description,
    imageUrl: record.imageUrl, imageAlt: record.imageAlt,
  }));
}
export async function getAdminSourcingCategories(): Promise<AdminSourcingCategory[]> {
  await connectDB();
  return (await SourcingCategoryModel.find({}).sort(SORT).lean()).map(toAdmin);
}
export async function getSourcingSettings(): Promise<SourcingSettings> {
  await connectDB();
  const record = await SourcingSettingsModel.findOne({ key: "main" }).lean();
  return record ? {
    eyebrow: record.eyebrow, heading: record.heading, description: record.description,
    ctaText: record.ctaText, ctaHref: "/buying-house",
  } : { ...defaultSourcingSettings };
}
export async function createSourcingCategory(input: SourcingCategoryInput, image: SourcingImage) {
  await connectDB();
  const slug = input.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || randomUUID();
  return toAdmin((await SourcingCategoryModel.create({ ...input, ...image, slug })).toObject());
}
export async function updateSourcingCategory(id: string, changes: Partial<SourcingCategoryInput> & { image?: SourcingImage }) {
  await connectDB();
  const { image, ...fields } = changes;
  const record = await SourcingCategoryModel.findByIdAndUpdate(id,
    { $set: { ...fields, ...(image ?? {}) } }, { new: true, runValidators: true }).lean();
  return record ? toAdmin(record) : null;
}
export async function deleteSourcingCategory(id: string) {
  await connectDB();
  return (await SourcingCategoryModel.deleteOne({ _id: id })).deletedCount === 1;
}
export async function reorderSourcingCategories(ids: string[]) {
  await connectDB();
  const existing = await SourcingCategoryModel.find({}).select("_id").lean();
  if (existing.length !== ids.length || existing.some(record => !ids.includes(record._id.toString()))) return null;
  const result = await SourcingCategoryModel.bulkWrite(ids.map((id, sortOrder) => ({
    updateOne: { filter: { _id: id }, update: { $set: { sortOrder } } },
  })));
  if (result.matchedCount !== ids.length) return null;
  return getAdminSourcingCategories();
}
export async function saveSourcingSettings(settings: SourcingSettings) {
  await connectDB();
  await SourcingSettingsModel.updateOne({ key: "main" }, { $set: settings }, { upsert: true, runValidators: true });
  return getSourcingSettings();
}

