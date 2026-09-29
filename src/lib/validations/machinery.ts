import { z } from "zod";
import { FACTORY_PDF_FOLDER } from "@/lib/machinery-defaults";

export const MACHINERY_ID_PATTERN = /^[a-f\d]{24}$/i;

const categoryFields = {
  name: z.string().trim().min(1, "Enter a category name.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by single hyphens.",
    )
    .max(120),
  sortOrder: z.number().int().min(0).max(9999),
};

export const machineryCategoryCreateSchema = z.object(categoryFields).strict();

export const machineryCategoryUpdateSchema = z
  .object(categoryFields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

const itemFields = {
  categoryId: z
    .string()
    .regex(MACHINERY_ID_PATTERN, "Choose a category."),
  slNo: z
    .number()
    .int()
    .min(1, "Serial numbers start at 1.")
    .max(9999),
  machineName: z.string().trim().min(1, "Enter a machine name.").max(160),
  // "Open" is a real brand in this data, so an empty brand is stored as null.
  brand: z.string().trim().max(80, "Brand is too long.").nullable().optional(),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(999999),
  sortOrder: z.number().int().min(0).max(9999),
};

export const machineryItemCreateSchema = z.object(itemFields).strict();

export const machineryItemUpdateSchema = z
  .object(itemFields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

export const machineryOrderSchema = z
  .object({
    ids: z
      .array(z.string().regex(MACHINERY_ID_PATTERN))
      .min(1)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each record must appear exactly once.",
      ),
  })
  .strict();

/**
 * Renumbering is always scoped to one category, so the category travels with the
 * list. Declared as its own schema rather than an extension, because a refined
 * object schema cannot be safely extended.
 */
export const machineryItemOrderSchema = z
  .object({
    categoryId: z
      .string()
      .regex(MACHINERY_ID_PATTERN, "Choose a category."),
    ids: z
      .array(z.string().regex(MACHINERY_ID_PATTERN))
      .min(1)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each machine must appear exactly once.",
      ),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*  The admin-managed factory profile PDF                                     */
/* -------------------------------------------------------------------------- */

export const FACTORY_PDF_ACCEPT = "application/pdf";
export const MAX_FACTORY_PDF_BYTES = 10 * 1024 * 1024;
export const FACTORY_PDF_SIZE_MESSAGE = "The PDF must be 10 MB or smaller.";

export const factoryPdfSchema = z
  .object({
    url: z.string().trim().min(1, "Upload the factory profile PDF.").max(2048),
    publicId: z
      .string()
      .regex(
        new RegExp(`^${FACTORY_PDF_FOLDER}/[A-Za-z0-9_-]{8,64}$`),
        "Use a PDF uploaded through this editor.",
      ),
    fileName: z
      .string()
      .trim()
      .min(1, "Upload the factory profile PDF.")
      .max(160),
  })
  .strict()
  .refine(
    ({ url, publicId }) => {
      try {
        const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        if (!cloud) return false;
        const parsed = new URL(url);
        if (
          parsed.origin !== "https://res.cloudinary.com" ||
          parsed.search ||
          parsed.hash
        ) {
          return false;
        }
        // Stored as a raw asset, because a PDF is delivered unchanged.
        const prefix = `/${cloud}/raw/upload/`;
        if (!parsed.pathname.startsWith(prefix)) return false;
        const path = parsed.pathname
          .slice(prefix.length)
          .replace(/^v\d+\//, "");
        return path === `${publicId}.pdf`;
      } catch {
        return false;
      }
    },
    "The document reference does not match a factory PDF upload.",
  );

/**
 * `null` removes the document, which is what makes the "Own Factory" buttons
 * disappear again rather than link to a file that is no longer stored.
 */
export const factoryPdfSaveSchema = z
  .object({ pdf: factoryPdfSchema.nullable() })
  .strict();
