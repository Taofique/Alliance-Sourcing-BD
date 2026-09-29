import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  MachineryCategoryModel,
  MachineryItemModel,
  MachinerySettingsModel,
} from "@/models/machinery";
import type {
  AdminMachineryCategory,
  AdminMachineryItem,
  FactoryPdf,
  MachineryCategoryGroup,
  MachineryCategoryInput,
  MachineryInventory,
  MachineryItem,
  MachineryItemInput,
} from "@/types/machinery";

const CATEGORY_SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;
const ITEM_SORT = { categoryId: 1, sortOrder: 1, slNo: 1, _id: 1 } as const;

/** An empty brand is stored as null so the column renders a dash, not a gap. */
function normalizeBrand(brand: string | null | undefined) {
  return brand ? brand : null;
}

function toItem(record: {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  slNo: number;
  machineName: string;
  brand?: string | null;
  quantity: number;
  sortOrder: number;
}): MachineryItem {
  return {
    id: record._id.toString(),
    categoryId: record.categoryId.toString(),
    slNo: record.slNo,
    machineName: record.machineName,
    brand: record.brand ?? null,
    quantity: record.quantity,
    sortOrder: record.sortOrder,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The published inventory: every category that has at least one machine, its
 * rows, and the totals summed from `quantity` right now.
 *
 * Nothing here is stored. A category total is the sum of the rows being
 * returned and the grand total is the sum of those, so a quantity edited in the
 * admin is reflected on the next render with no reconciliation step.
 */
export async function getMachineryInventory(): Promise<MachineryInventory> {
  await connectDB();

  const categories = await MachineryCategoryModel.find({}).sort(CATEGORY_SORT).lean();

  if (categories.length === 0) {
    return { categories: [], grandTotal: 0 };
  }

  const records = await MachineryItemModel.find({
    categoryId: { $in: categories.map((category) => category._id) },
  })
    .sort(ITEM_SORT)
    .lean();

  const rowsByCategory = new Map<string, MachineryItem[]>();
  for (const record of records) {
    const key = record.categoryId.toString();
    const item = toItem(record);
    const existing = rowsByCategory.get(key);
    if (existing) {
      existing.push(item);
    } else {
      rowsByCategory.set(key, [item]);
    }
  }

  const groups: MachineryCategoryGroup[] = [];
  let grandTotal = 0;

  for (const category of categories) {
    const items = rowsByCategory.get(category._id.toString()) ?? [];

    // A category with nothing in it would render an empty table, so it is
    // hidden rather than published as a heading over no rows.
    if (items.length === 0) continue;

    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    grandTotal += total;

    groups.push({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      total,
      items,
    });
  }

  return { categories: groups, grandTotal };
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminMachineryCategories(): Promise<
  AdminMachineryCategory[]
> {
  await connectDB();

  const [categories, totals] = await Promise.all([
    MachineryCategoryModel.find({}).sort(CATEGORY_SORT).lean(),
    // One grouped pass instead of a query per category.
    MachineryItemModel.aggregate<{
      _id: Types.ObjectId;
      total: number;
      count: number;
    }>([{ $group: { _id: "$categoryId", total: { $sum: "$quantity" }, count: { $sum: 1 } } }]),
  ]);

  const statsByCategory = new Map(
    totals.map((entry) => [entry._id.toString(), entry]),
  );

  return categories.map((category) => {
    const stats = statsByCategory.get(category._id.toString());
    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      itemCount: stats?.count ?? 0,
      total: stats?.total ?? 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  });
}

export async function createMachineryCategory(
  input: MachineryCategoryInput,
): Promise<AdminMachineryCategory | null> {
  await connectDB();

  const [created] = await Promise.all([
    MachineryCategoryModel.create(input),
    // Fail before inserting if the slug is already taken, so the caller gets a
    // duplicate error rather than a silently mangled unique index.
    // `unique: true` in a schema is a declaration, not a guarantee, until the
    // index actually exists, so both are created before anything is written.
    MachineryCategoryModel.collection.createIndex({ slug: 1 }, { unique: true }),
    MachineryCategoryModel.collection.createIndex({ name: 1 }, { unique: true }),
  ]);

  return toAdminCategory(created.toObject(), 0, 0);
}

export async function updateMachineryCategory(
  id: string,
  changes: Partial<MachineryCategoryInput>,
): Promise<AdminMachineryCategory | null> {
  await connectDB();

  const record = await MachineryCategoryModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, runValidators: true },
  ).lean();

  if (!record) return null;

  const [stats] = await MachineryItemModel.aggregate<{ total: number; count: number }>([
    { $match: { categoryId: record._id } },
    { $group: { _id: null, total: { $sum: "$quantity" }, count: { $sum: 1 } } },
  ]);

  return toAdminCategory(record, stats?.count ?? 0, stats?.total ?? 0);
}

/**
 * Removing a category removes its machines with it.
 *
 * MongoDB has no foreign keys, so the cascade is explicit: the items are only
 * deleted once the category itself is confirmed gone, which is what stops a
 * failed category delete from orphaning rows nobody can reach.
 */
export async function deleteMachineryCategory(id: string) {
  await connectDB();

  const objectId = new Types.ObjectId(id);
  const deleted = await MachineryCategoryModel.deleteOne({ _id: objectId });

  if (deleted.deletedCount !== 1) return false;

  await MachineryItemModel.deleteMany({ categoryId: objectId });

  return true;
}

export async function reorderMachineryCategories(ids: string[]) {
  await connectDB();

  const existing = await MachineryCategoryModel.find({}).select("_id").lean();

  // Refuse a partial reorder: it would silently renumber categories the caller
  // did not send and scramble the published order.
  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await MachineryCategoryModel.bulkWrite(
    ids.map((id, sortOrder) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { sortOrder } },
      },
    })),
  );

  if (result.matchedCount !== ids.length) return null;

  return getAdminMachineryCategories();
}

function toAdminCategory(
  record: { _id: Types.ObjectId; name: string; slug: string; sortOrder: number; createdAt: Date; updatedAt: Date },
  itemCount: number,
  total: number,
): AdminMachineryCategory {
  return {
    id: record._id.toString(),
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    itemCount,
    total,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Items                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAdminMachineryItems(
  categoryId?: string,
): Promise<AdminMachineryItem[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);

  const [records, categories] = await Promise.all([
    MachineryItemModel.find(filter)
      .sort(categoryId ? ITEM_SORT : { categoryId: 1, sortOrder: 1, slNo: 1, _id: 1 })
      .lean(),
    MachineryCategoryModel.find({}).select("name").lean(),
  ]);

  const nameByCategory = new Map(
    categories.map((category) => [category._id.toString(), category.name]),
  );

  return records.map((record) => ({
    id: record._id.toString(),
    categoryId: record.categoryId.toString(),
    categoryName:
      nameByCategory.get(record.categoryId.toString()) ?? "Unknown category",
    slNo: record.slNo,
    machineName: record.machineName,
    brand: record.brand ?? null,
    quantity: record.quantity,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

/** `null` means the chosen category does not exist. */
export async function createMachineryItem(
  input: Omit<MachineryItemInput, "categoryId" | "brand"> & {
    categoryId: string;
    brand?: string | null;
  },
): Promise<AdminMachineryItem | null> {
  await connectDB();

  const categoryId = new Types.ObjectId(input.categoryId);
  if (!(await MachineryCategoryModel.exists({ _id: categoryId }))) return null;

  const created = await MachineryItemModel.create({
    categoryId,
    slNo: input.slNo,
    machineName: input.machineName,
    brand: normalizeBrand(input.brand),
    quantity: input.quantity,
    sortOrder: input.sortOrder,
  });

  return toAdminItem(created.toObject(), await categoryName(categoryId));
}

export async function updateMachineryItem(
  id: string,
  changes: Partial<Omit<MachineryItemInput, "categoryId">> & {
    brand?: string | null;
    /** Moves the machine to another category, landing at the end of it. */
    categoryId?: string;
  },
): Promise<AdminMachineryItem | null> {
  await connectDB();

  const fields: Record<string, unknown> = { ...changes };

  if (changes.brand !== undefined) {
    fields.brand = normalizeBrand(changes.brand);
  }

  if (changes.categoryId !== undefined) {
    const targetId = new Types.ObjectId(changes.categoryId);

    if (!(await MachineryCategoryModel.exists({ _id: targetId }))) return null;

    /*
     * A sort order is only meaningful inside its own category, so a machine
     * moved to another category has to be renumbered. It goes to the end
     * rather than keeping its old number, which would otherwise collide with
     * the rows already there.
     */
    const last = await MachineryItemModel.findOne({ categoryId: targetId })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    fields.categoryId = targetId;
    fields.sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const record = await MachineryItemModel.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();

  if (!record) return null;

  return toAdminItem(record, await categoryName(record.categoryId));
}

export async function deleteMachineryItem(id: string) {
  await connectDB();
  return (await MachineryItemModel.deleteOne({ _id: id })).deletedCount === 1;
}

/**
 * Renumbers one category's machines into the submitted order.
 *
 * The ids must be exactly the machines already in that category — a partial
 * list would leave the omitted rows sharing sort orders with the rest.
 */
export async function reorderMachineryItems(
  categoryId: string,
  ids: string[],
) {
  await connectDB();

  const objectId = new Types.ObjectId(categoryId);
  const existing = await MachineryItemModel.find({ categoryId: objectId })
    .select("_id")
    .lean();

  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await MachineryItemModel.bulkWrite(
    ids.map((id, position) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), categoryId: objectId },
        // Both columns are renumbered together: `sortOrder` drives the order,
        // and `slNo` is the "No." the reader sees, so the two can never drift
        // apart after a move.
        update: { $set: { sortOrder: position, slNo: position + 1 } },
      },
    })),
  );

  if (result.matchedCount !== ids.length) return null;

  return getAdminMachineryItems(categoryId);
}

async function categoryName(categoryId: Types.ObjectId) {
  const record = await MachineryCategoryModel.findById(categoryId)
    .select("name")
    .lean();
  return record?.name ?? "Unknown category";
}

function toAdminItem(
  record: {
    _id: Types.ObjectId;
    categoryId: Types.ObjectId;
    slNo: number;
    machineName: string;
    brand?: string | null;
    quantity: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  },
  name: string,
): AdminMachineryItem {
  return {
    id: record._id.toString(),
    categoryId: record.categoryId.toString(),
    categoryName: name,
    slNo: record.slNo,
    machineName: record.machineName,
    brand: record.brand ?? null,
    quantity: record.quantity,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Factory profile PDF                                                       */
/* -------------------------------------------------------------------------- */

export async function getFactoryPdf(): Promise<FactoryPdf | null> {
  await connectDB();

  const record = await MachinerySettingsModel.findOne({ key: "main" }).lean();

  return record?.factoryPdf ?? null;
}

export async function saveFactoryPdf(pdf: FactoryPdf | null) {
  await connectDB();

  await MachinerySettingsModel.updateOne(
    { key: "main" },
    { $set: { factoryPdf: pdf } },
    { upsert: true, runValidators: true },
  );

  return getFactoryPdf();
}
