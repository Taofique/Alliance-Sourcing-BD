import "server-only";

import { connectDB } from "@/lib/db";
import { Banner } from "@/models/banner";
import type {
  AdminBanner,
  BannerCta,
  BannerInput,
  BannerSlide,
} from "@/types/banner";

type BannerLean = {
  _id: { toString(): string };
  title: string;
  description: string;
  imageUrl: string;
  publicId: string | null;
  imageAlt: string;
  cta: BannerCta | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Stable ordering for every reader: sortOrder, then creation time, then id.
const SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;

function toIso(value: Date) {
  return new Date(value).toISOString();
}

function toAdminBanner(record: BannerLean): AdminBanner {
  return {
    id: record._id.toString(),
    title: record.title,
    description: record.description,
    imageUrl: record.imageUrl,
    publicId: record.publicId ?? null,
    imageAlt: record.imageAlt,
    cta: record.cta
      ? { text: record.cta.text, href: record.cta.href }
      : null,
    sortOrder: record.sortOrder,
    isPublished: record.isPublished,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

function toPublicSlide(record: BannerLean): BannerSlide {
  return {
    id: record._id.toString(),
    title: record.title,
    description: record.description,
    imageUrl: record.imageUrl,
    imageAlt: record.imageAlt,
    cta: record.cta
      ? { text: record.cta.text, href: record.cta.href }
      : null,
  };
}

/** Public homepage data. Plain objects only — never Mongoose documents. */
export async function getPublishedBanners(): Promise<BannerSlide[]> {
  await connectDB();

  const records = await Banner.find({ isPublished: true })
    .sort(SORT)
    .lean()
    .exec();

  return records.map((record) => toPublicSlide(record as BannerLean));
}

/** Admin list data, published or not. */
export async function getAdminBanners(): Promise<AdminBanner[]> {
  await connectDB();

  const records = await Banner.find({}).sort(SORT).lean().exec();

  return records.map((record) => toAdminBanner(record as BannerLean));
}

export async function getAdminBannerById(
  id: string,
): Promise<AdminBanner | null> {
  await connectDB();

  const record = await Banner.findById(id).lean().exec();

  return record ? toAdminBanner(record as BannerLean) : null;
}

export async function createBanner(
  input: BannerInput,
  image: { imageUrl: string; publicId: string },
) {
  await connectDB();

  const record = await Banner.create({
    ...input,
    cta: input.cta ?? null,
    imageUrl: image.imageUrl,
    publicId: image.publicId,
  });

  return toAdminBanner(record.toObject() as BannerLean);
}

/**
 * A text-only update omits the image, so the saved background is preserved.
 * A replaced image always arrives as a complete, freshly uploaded reference.
 */
export async function updateBanner(
  id: string,
  changes: Partial<BannerInput> & {
    image?: { imageUrl: string; publicId: string };
  },
) {
  await connectDB();

  const update: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "imageAlt",
    "cta",
    "sortOrder",
    "isPublished",
  ] as const) {
    if (Object.hasOwn(changes, key)) update[key] = changes[key] ?? null;
  }
  if (changes.image) {
    update.imageUrl = changes.image.imageUrl;
    update.publicId = changes.image.publicId;
  }

  const result = await Banner.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  return result ? toAdminBanner(result as BannerLean) : null;
}

export async function deleteBanner(id: string) {
  await connectDB();
  const result = await Banner.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

/** Rewrites sortOrder to match the submitted order. All ids must exist. */
export async function reorderBanners(ids: string[]) {
  await connectDB();

  const existing = await Banner.find({ _id: { $in: ids } })
    .select("_id")
    .lean()
    .exec();

  if (existing.length !== ids.length) return false;

  await Banner.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
    })),
  );

  return true;
}
