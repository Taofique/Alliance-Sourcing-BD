import "server-only";
import { Schema, Types, model, models, type Model } from "mongoose";
import type { FactoryPdf } from "@/types/machinery";

/**
 * The machinery inventory, one document per category and one per machine.
 *
 * Totals are deliberately not stored. `quantity` is the only number that is
 * written, and every category total and the grand total are summed when the
 * inventory is read, so an admin edit can never leave a stale total behind.
 */
export type MachineryCategoryRecord = {
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<MachineryCategoryRecord>(
  {
    // The heading is the identity a reader sees, so it is unique on its own.
    // A unique index (not just a Zod rule) is what makes it true under two
    // simultaneous saves.
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
  },
  { timestamps: true, collection: "machinery_categories" },
);
categorySchema.index({ sortOrder: 1, createdAt: 1, _id: 1 });

export type MachineryItemRecord = {
  categoryId: Types.ObjectId;
  slNo: number;
  machineName: string;
  brand: string | null;
  quantity: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const itemSchema = new Schema<MachineryItemRecord>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "MachineryCategory",
      required: true,
    },
    slNo: { type: Number, required: true, min: 1, max: 9999 },
    machineName: { type: String, required: true, trim: true },
    // "Open" is a legitimate brand in this data, so an absent brand is null.
    brand: { type: String, default: null, trim: true },
    quantity: { type: Number, required: true, min: 0, max: 999999 },
    sortOrder: { type: Number, required: true, default: 0, min: 0, max: 9999 },
  },
  { timestamps: true, collection: "machinery_items" },
);
// The public table reads one category at a time, already in display order.
itemSchema.index({ categoryId: 1, sortOrder: 1, slNo: 1, _id: 1 });

export type MachinerySettingsRecord = {
  key: string;
  factoryPdf: FactoryPdf | null;
  createdAt: Date;
  updatedAt: Date;
};

const factoryPdfSchema = new Schema<FactoryPdf>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const settingsSchema = new Schema<MachinerySettingsRecord>(
  {
    key: { type: String, required: true, unique: true },
    factoryPdf: { type: factoryPdfSchema, default: null },
  },
  { timestamps: true, collection: "machinery_settings" },
);

// Re-registration guard, matching the sourcing and banner models.
export const MachineryCategoryModel =
  (models.MachineryCategory as Model<MachineryCategoryRecord> | undefined) ??
  model<MachineryCategoryRecord>("MachineryCategory", categorySchema);

export const MachineryItemModel =
  (models.MachineryItem as Model<MachineryItemRecord> | undefined) ??
  model<MachineryItemRecord>("MachineryItem", itemSchema);

export const MachinerySettingsModel =
  (models.MachinerySettings as Model<MachinerySettingsRecord> | undefined) ??
  model<MachinerySettingsRecord>("MachinerySettings", settingsSchema);
