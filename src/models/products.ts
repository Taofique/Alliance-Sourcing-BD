import "server-only";
import { Schema, Types, model, models, type Model } from "mongoose";
import type { ProductImage } from "@/types/products";

/**
 * The product catalogue shown on /buying-house: a category, its subcategories,
 * and the products inside them.
 *
 * Counts are deliberately not stored. A subcategory's product count and a
 * category's two counts are summed when the catalogue is read, so a product
 * added, renamed, hidden or deleted in the admin can never leave a stale
 * number behind.
 */
export type ProductCategoryRecord = {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<ProductCategoryRecord>(
  {
    // The heading is the identity a reader sees, so it is unique on its own.
    // A unique index (not just a Zod rule) is what makes it true under two
    // simultaneous saves.
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "product_categories" },
);
categorySchema.index({ sortOrder: 1, createdAt: 1, _id: 1 });

export type ProductSubcategoryRecord = {
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const subcategorySchema = new Schema<ProductSubcategoryRecord>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    // A subcategory slug only has to be unique inside its own category, so two
    // categories can both have a "t-shirt" address without colliding.
    slug: { type: String, required: true, trim: true, lowercase: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "product_subcategories" },
);
subcategorySchema.index({ categoryId: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ categoryId: 1, sortOrder: 1, createdAt: 1, _id: 1 });

const imageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false },
);

export type ProductRecord = {
  subcategoryId: Types.ObjectId;
  name: string;
  image: ProductImage;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const productSchema = new Schema<ProductRecord>(
  {
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductSubcategory",
      required: true,
    },
    // Deliberately not unique: the catalogue ships five separate "Five Pocket
    // Twill" garments and two of each ladies' style, each with its own
    // photograph, so a repeated name is a legitimate record.
    name: { type: String, required: true, trim: true },
    image: { type: imageSchema, required: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "products" },
);
// The public grid reads one subcategory at a time, already in display order.
productSchema.index({ subcategoryId: 1, sortOrder: 1, createdAt: 1, _id: 1 });

// Re-registration guard, matching the machinery and sourcing models.
export const ProductCategoryModel =
  (models.ProductCategory as Model<ProductCategoryRecord> | undefined) ??
  model<ProductCategoryRecord>("ProductCategory", categorySchema);

export const ProductSubcategoryModel =
  (models.ProductSubcategory as Model<ProductSubcategoryRecord> | undefined) ??
  model<ProductSubcategoryRecord>("ProductSubcategory", subcategorySchema);

export const ProductModel =
  (models.Product as Model<ProductRecord> | undefined) ??
  model<ProductRecord>("Product", productSchema);
