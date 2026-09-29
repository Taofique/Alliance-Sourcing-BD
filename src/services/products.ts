import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  ProductCategoryModel,
  ProductModel,
  ProductSubcategoryModel,
} from "@/models/products";
import type {
  AdminProduct,
  AdminProductCategory,
  AdminProductSubcategory,
  ProductCatalog,
  ProductCategoryInput,
  ProductImage,
  ProductInput,
  ProductSubcategoryInput,
  PublicProduct,
  PublicProductCategory,
  PublicProductSubcategory,
} from "@/types/products";

const CATEGORY_SORT = { sortOrder: 1, createdAt: 1, _id: 1 } as const;
const SUBCATEGORY_SORT = { categoryId: 1, sortOrder: 1, createdAt: 1, _id: 1 } as const;
const PRODUCT_SORT = { subcategoryId: 1, sortOrder: 1, createdAt: 1, _id: 1 } as const;

type CategoryDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProductDoc = {
  _id: Types.ObjectId;
  subcategoryId: Types.ObjectId;
  name: string;
  image: ProductImage;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The published catalogue: every active category that has something to show, its
 * active subcategories, and their active products.
 *
 * Nothing here is stored. The counts printed beside each subcategory are the
 * length of the array being returned, and a branch with no products is skipped
 * entirely rather than published as a heading over an empty grid.
 */
export async function getProductCatalog(): Promise<ProductCatalog> {
  await connectDB();

  const categories = await ProductCategoryModel.find({ isActive: true })
    .sort(CATEGORY_SORT)
    .lean();

  if (categories.length === 0) return { categories: [] };

  const categoryIds = categories.map((category) => category._id);

  const subcategories = await ProductSubcategoryModel.find({
    categoryId: { $in: categoryIds },
    isActive: true,
  })
    .sort(SUBCATEGORY_SORT)
    .lean();

  // Read through the subcategories already fetched, so a product whose
  // subcategory is hidden, or which belongs to a hidden category, is never
  // fetched and can never be counted.
  const products =
    subcategories.length === 0
      ? []
      : await ProductModel.find({
          subcategoryId: { $in: subcategories.map((subcategory) => subcategory._id) },
          isActive: true,
        })
          .sort(PRODUCT_SORT)
          .lean();

  const productsBySubcategory = new Map<string, PublicProduct[]>();
  for (const product of products) {
    const key = product.subcategoryId.toString();
    const item: PublicProduct = {
      id: product._id.toString(),
      name: product.name,
      imageUrl: product.image.url,
    };
    const existing = productsBySubcategory.get(key);
    if (existing) {
      existing.push(item);
    } else {
      productsBySubcategory.set(key, [item]);
    }
  }

  const subcategoriesByCategory = new Map<string, PublicProductSubcategory[]>();
  for (const subcategory of subcategories) {
    const items = productsBySubcategory.get(subcategory._id.toString()) ?? [];
    // An empty subcategory would render a heading and a rule over no cards, so
    // it is hidden rather than published.
    if (items.length === 0) continue;

    const key = subcategory.categoryId.toString();
    const entry: PublicProductSubcategory = {
      id: subcategory._id.toString(),
      name: subcategory.name,
      productCount: items.length,
      products: items,
    };
    const existing = subcategoriesByCategory.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      subcategoriesByCategory.set(key, [entry]);
    }
  }

  const result: PublicProductCategory[] = [];
  for (const category of categories) {
    const branch = subcategoriesByCategory.get(category._id.toString()) ?? [];
    // Same reasoning one level up: a category with nothing in it is hidden.
    if (branch.length === 0) continue;

    result.push({
      id: category._id.toString(),
      name: category.name,
      subcategories: branch,
    });
  }

  return { categories: result };
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

type Counts = { subcategoryCount: number; productCount: number };

/**
 * Category and product counts for a set of categories, in two grouped passes
 * rather than a query per category.
 *
 * A category's product count is the sum of its subcategories' counts, which is
 * what a reader sees on the page, so it is counted the same way here.
 */
async function categoryCounts(categoryIds: Types.ObjectId[]) {
  const [subcategoryTotals, productTotals] = await Promise.all([
    ProductSubcategoryModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    ProductSubcategoryModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: { $in: categoryIds } } },
      {
        $lookup: {
          from: ProductModel.collection.collectionName,
          localField: "_id",
          foreignField: "subcategoryId",
          as: "products",
        },
      },
      { $project: { categoryId: 1, count: { $size: "$products" } } },
      { $group: { _id: "$categoryId", count: { $sum: "$count" } } },
    ]),
  ]);

  const subcategories = new Map(
    subcategoryTotals.map((entry) => [entry._id.toString(), entry.count]),
  );
  const products = new Map(
    productTotals.map((entry) => [entry._id.toString(), entry.count]),
  );

  return (categoryId: Types.ObjectId): Counts => ({
    subcategoryCount: subcategories.get(categoryId.toString()) ?? 0,
    productCount: products.get(categoryId.toString()) ?? 0,
  });
}

export async function getAdminProductCategories(): Promise<AdminProductCategory[]> {
  await connectDB();

  const categories = await ProductCategoryModel.find({}).sort(CATEGORY_SORT).lean();
  if (categories.length === 0) return [];

  const counts = await categoryCounts(categories.map((category) => category._id));

  return categories.map((category) => {
    const stats = counts(category._id);
    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      subcategoryCount: stats.subcategoryCount,
      productCount: stats.productCount,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  });
}

export async function createProductCategory(
  input: ProductCategoryInput,
): Promise<AdminProductCategory | null> {
  await connectDB();

  const [created] = await Promise.all([
    ProductCategoryModel.create(input),
    // `unique: true` in a schema is a declaration, not a guarantee, until the
    // index actually exists, so both are created before anything is written.
    ProductCategoryModel.collection.createIndex({ slug: 1 }, { unique: true }),
    ProductCategoryModel.collection.createIndex({ name: 1 }, { unique: true }),
  ]);

  return toAdminCategory(created.toObject(), { subcategoryCount: 0, productCount: 0 });
}

export async function updateProductCategory(
  id: string,
  changes: Partial<ProductCategoryInput>,
): Promise<AdminProductCategory | null> {
  await connectDB();

  const record = await ProductCategoryModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, runValidators: true },
  ).lean();

  if (!record) return null;

  const counts = await categoryCounts([record._id]);
  return toAdminCategory(record, counts(record._id));
}

/**
 * Removing a category removes its subcategories and their products with it.
 *
 * MongoDB has no foreign keys, so the cascade is explicit and runs only once the
 * parent itself is confirmed gone, which is what stops a failed category delete
 * from orphaning rows nobody can reach.
 */
export async function deleteProductCategory(id: string) {
  await connectDB();

  const objectId = new Types.ObjectId(id);
  const deleted = await ProductCategoryModel.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) return false;

  const subcategoryIds = await ProductSubcategoryModel.find({ categoryId: objectId })
    .select("_id")
    .lean();

  await ProductSubcategoryModel.deleteMany({ categoryId: objectId });

  if (subcategoryIds.length > 0) {
    await ProductModel.deleteMany({
      subcategoryId: { $in: subcategoryIds.map((entry) => entry._id) },
    });
  }

  return true;
}

export async function reorderProductCategories(ids: string[]) {
  await connectDB();

  const existing = await ProductCategoryModel.find({}).select("_id").lean();

  // Refuse a partial reorder: it would silently renumber categories the caller
  // did not send and scramble the published order.
  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await ProductCategoryModel.bulkWrite(
    ids.map((id, sortOrder) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { sortOrder } },
      },
    })),
  );

  if (result.matchedCount !== ids.length) return null;

  return getAdminProductCategories();
}

function toAdminCategory(record: CategoryDoc, counts: Counts): AdminProductCategory {
  return {
    id: record._id.toString(),
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
    subcategoryCount: counts.subcategoryCount,
    productCount: counts.productCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Subcategories                                                             */
/* -------------------------------------------------------------------------- */

export async function getAdminProductSubcategories(
  categoryId?: string,
): Promise<AdminProductSubcategory[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);

  const [records, categories, totals] = await Promise.all([
    ProductSubcategoryModel.find(filter).sort(SUBCATEGORY_SORT).lean(),
    ProductCategoryModel.find({}).select("name").lean(),
    ProductModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$subcategoryId", count: { $sum: 1 } } },
    ]),
  ]);

  const nameByCategory = new Map(
    categories.map((category) => [category._id.toString(), category.name]),
  );
  const countBySubcategory = new Map(
    totals.map((entry) => [entry._id.toString(), entry.count]),
  );

  return records.map((record) => ({
    id: record._id.toString(),
    categoryId: record.categoryId.toString(),
    categoryName:
      nameByCategory.get(record.categoryId.toString()) ?? "Unknown category",
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
    productCount: countBySubcategory.get(record._id.toString()) ?? 0,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

/** `null` means the chosen category does not exist. */
export async function createProductSubcategory(
  input: ProductSubcategoryInput,
): Promise<AdminProductSubcategory | null> {
  await connectDB();

  const categoryId = new Types.ObjectId(input.categoryId);
  if (!(await ProductCategoryModel.exists({ _id: categoryId }))) return null;

  const [created] = await Promise.all([
    ProductSubcategoryModel.create({ ...input, categoryId }),
    // A subcategory slug is only unique inside its own category, so the guard is
    // the compound index rather than a global one.
    ProductSubcategoryModel.collection.createIndex(
      { categoryId: 1, slug: 1 },
      { unique: true },
    ),
  ]);

  const record = created.toObject();
  return {
    id: record._id.toString(),
    categoryId: record.categoryId.toString(),
    categoryName: (await ProductCategoryModel.findById(categoryId).select("name").lean())
      ?.name ?? "Unknown category",
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
    productCount: 0,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function updateProductSubcategory(
  id: string,
  changes: Partial<ProductSubcategoryInput>,
): Promise<AdminProductSubcategory | null> {
  await connectDB();

  const fields: Record<string, unknown> = { ...changes };

  if (changes.categoryId !== undefined) {
    const targetId = new Types.ObjectId(changes.categoryId);
    if (!(await ProductCategoryModel.exists({ _id: targetId }))) return null;

    /*
     * A sort order is only meaningful inside its own category, so a
     * subcategory moved to another category has to be renumbered. It goes to
     * the end, which would otherwise collide with the rows already there.
     */
    const last = await ProductSubcategoryModel.findOne({ categoryId: targetId })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    fields.categoryId = targetId;
    fields.sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const record = await ProductSubcategoryModel.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();

  if (!record) return null;

  return (await getAdminProductSubcategories()).find(
    (entry) => entry.id === record._id.toString(),
  ) ?? null;
}

/**
 * Removing a subcategory removes its products with it, for the same reason a
 * category takes its subcategories: a product left behind would be unreachable.
 */
export async function deleteProductSubcategory(id: string) {
  await connectDB();

  const objectId = new Types.ObjectId(id);
  const deleted = await ProductSubcategoryModel.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) return false;

  await ProductModel.deleteMany({ subcategoryId: objectId });

  return true;
}

export async function reorderProductSubcategories(categoryId: string, ids: string[]) {
  await connectDB();

  const objectId = new Types.ObjectId(categoryId);
  const existing = await ProductSubcategoryModel.find({ categoryId: objectId })
    .select("_id")
    .lean();

  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await ProductSubcategoryModel.bulkWrite(
    ids.map((id, position) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), categoryId: objectId },
        update: { $set: { sortOrder: position } },
      },
    })),
  );

  if (result.matchedCount !== ids.length) return null;

  return getAdminProductSubcategories(categoryId);
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminProducts(
  subcategoryId?: string,
): Promise<AdminProduct[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (subcategoryId) filter.subcategoryId = new Types.ObjectId(subcategoryId);

  const [records, subcategories] = await Promise.all([
    ProductModel.find(filter).sort(PRODUCT_SORT).lean(),
    ProductSubcategoryModel.find({}).select("name categoryId").lean(),
  ]);

  // One read of the categories actually referenced, rather than every category.
  const categoryIds = [
    ...new Map(subcategories.map((entry) => [entry.categoryId.toString(), entry])).keys(),
  ];
  const categories = await ProductCategoryModel.find({
    _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("name")
    .lean();

  const nameBySubcategory = new Map(
    subcategories.map((entry) => [entry._id.toString(), entry]),
  );
  const nameByCategory = new Map(
    categories.map((category) => [category._id.toString(), category.name]),
  );

  return records.map((record) => {
    const subcategory = nameBySubcategory.get(record.subcategoryId.toString());
    return {
      id: record._id.toString(),
      subcategoryId: record.subcategoryId.toString(),
      subcategoryName: subcategory?.name ?? "Unknown subcategory",
      categoryName: subcategory
        ? (nameByCategory.get(subcategory.categoryId.toString()) ?? "Unknown category")
        : "Unknown category",
      name: record.name,
      image: record.image,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });
}

/** `null` means the chosen subcategory does not exist. */
export async function createProduct(
  input: ProductInput,
): Promise<AdminProduct | null> {
  await connectDB();

  const subcategoryId = new Types.ObjectId(input.subcategoryId);
  if (!(await ProductSubcategoryModel.exists({ _id: subcategoryId }))) return null;

  const last = await ProductModel.findOne({ subcategoryId })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();

  const created = await ProductModel.create({
    ...input,
    subcategoryId,
    sortOrder: input.sortOrder ?? (last?.sortOrder ?? -1) + 1,
  });

  return toAdminProduct(created.toObject(), await subcategoryLabels(subcategoryId));
}

export async function updateProduct(
  id: string,
  changes: Partial<ProductInput>,
): Promise<AdminProduct | null> {
  await connectDB();

  const fields: Record<string, unknown> = { ...changes };

  if (changes.subcategoryId !== undefined) {
    const targetId = new Types.ObjectId(changes.subcategoryId);
    if (!(await ProductSubcategoryModel.exists({ _id: targetId }))) return null;

    // A product moved to another subcategory lands at the end of it, for the
    // same reason a moved machine does.
    const last = await ProductModel.findOne({ subcategoryId: targetId })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    fields.subcategoryId = targetId;
    fields.sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const record = await ProductModel.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();

  if (!record) return null;

  return toAdminProduct(record, await subcategoryLabels(record.subcategoryId));
}

export async function deleteProduct(id: string) {
  await connectDB();
  return (await ProductModel.deleteOne({ _id: id })).deletedCount === 1;
}

/**
 * Renumbers one subcategory's products into the submitted order.
 *
 * The ids must be exactly the products already in that subcategory — a partial
 * list would leave the omitted rows sharing sort orders with the rest.
 */
export async function reorderProducts(subcategoryId: string, ids: string[]) {
  await connectDB();

  const objectId = new Types.ObjectId(subcategoryId);
  const existing = await ProductModel.find({ subcategoryId: objectId })
    .select("_id")
    .lean();

  if (
    existing.length !== ids.length ||
    existing.some((record) => !ids.includes(record._id.toString()))
  ) {
    return null;
  }

  const result = await ProductModel.bulkWrite(
    ids.map((id, position) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), subcategoryId: objectId },
        update: { $set: { sortOrder: position } },
      },
    })),
  );

  if (result.matchedCount !== ids.length) return null;

  return getAdminProducts(subcategoryId);
}

/** The subcategory and category names shown beside a product in the admin. */
async function subcategoryLabels(subcategoryId: Types.ObjectId) {
  const subcategory = await ProductSubcategoryModel.findById(subcategoryId)
    .select("name categoryId")
    .lean();

  if (!subcategory) return { subcategoryName: "Unknown subcategory", categoryName: "Unknown category" };

  const category = await ProductCategoryModel.findById(subcategory.categoryId)
    .select("name")
    .lean();

  return {
    subcategoryName: subcategory.name,
    categoryName: category?.name ?? "Unknown category",
  };
}

function toAdminProduct(
  record: ProductDoc,
  labels: { subcategoryName: string; categoryName: string },
): AdminProduct {
  return {
    id: record._id.toString(),
    subcategoryId: record.subcategoryId.toString(),
    subcategoryName: labels.subcategoryName,
    categoryName: labels.categoryName,
    name: record.name,
    image: record.image,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
