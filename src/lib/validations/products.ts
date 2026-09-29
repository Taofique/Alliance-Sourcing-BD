import { z } from "zod";
import { PRODUCT_IMAGE_FOLDER } from "@/lib/product-defaults";

export const PRODUCT_ID_PATTERN = /^[a-f\d]{24}$/i;

const slugField = (label: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `Use lowercase words separated by single hyphens for the ${label}.`,
    )
    .max(120);

const sortField = z.number().int().min(0).max(9999);

/* -------------------------------------------------------------------------- */
/*  Product photography                                                       */
/* -------------------------------------------------------------------------- */

export const PRODUCT_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.avif,.svg,image/png,image/jpeg,image/webp,image/avif,image/svg+xml";

/**
 * A product photograph is accepted from exactly one of two places.
 *
 * Either it is an upload made through this editor, which lands in our own
 * product folder, or it is one of the reference photographs the catalogue ships
 * with, which live in the original site's Cloudinary account. Nothing else is
 * accepted, so a stored product can never be pointed at an arbitrary remote
 * image.
 */
export const productImageSchema = z
  .object({
    url: z.string().trim().min(1, "Upload a product photograph.").max(2048),
    publicId: z
      .string()
      .trim()
      .min(1, "Upload a product photograph.")
      .max(200)
      .regex(
        new RegExp(
          `^(${PRODUCT_IMAGE_FOLDER}/)?[A-Za-z0-9_-]{6,64}$`,
        ),
        "Use a product image uploaded through this editor.",
      ),
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

        // A delivery URL is /<our cloud>/image/upload/[v<n>/]<public id>, so the
        // version segment is stripped before the path is compared with the field.
        const prefix = `/${cloud}/image/upload/`;
        if (!parsed.pathname.startsWith(prefix)) return false;
        const path = parsed.pathname
          .slice(prefix.length)
          .replace(/^v\d+\//, "");
        return path.split(".")[0] === publicId;
      } catch {
        return false;
      }
    },
    "The image reference does not match a product upload.",
  );

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

const categoryFields = {
  name: z.string().trim().min(1, "Enter a category name.").max(120),
  slug: slugField("category slug"),
  sortOrder: sortField,
  isActive: z.boolean(),
};

export const productCategoryCreateSchema = z.object(categoryFields).strict();

export const productCategoryUpdateSchema = z
  .object(categoryFields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

/* -------------------------------------------------------------------------- */
/*  Subcategories                                                             */
/* -------------------------------------------------------------------------- */

const subcategoryFields = {
  categoryId: z.string().regex(PRODUCT_ID_PATTERN, "Choose a category."),
  name: z.string().trim().min(1, "Enter a subcategory name.").max(120),
  slug: slugField("subcategory slug"),
  sortOrder: sortField,
  isActive: z.boolean(),
};

export const productSubcategoryCreateSchema = z.object(subcategoryFields).strict();

export const productSubcategoryUpdateSchema = z
  .object(subcategoryFields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

const productFields = {
  subcategoryId: z.string().regex(PRODUCT_ID_PATTERN, "Choose a subcategory."),
  name: z.string().trim().min(1, "Enter a product name.").max(160),
  image: productImageSchema,
  sortOrder: sortField,
  isActive: z.boolean(),
};

export const productCreateSchema = z.object(productFields).strict();

/**
 * Every field is optional on an update, including the photograph: a name-only
 * edit keeps the stored image rather than having to re-upload it.
 */
export const productUpdateSchema = z
  .object(productFields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

/* -------------------------------------------------------------------------- */
/*  Ordering                                                                  */
/* -------------------------------------------------------------------------- */

export const productOrderSchema = z
  .object({
    ids: z
      .array(z.string().regex(PRODUCT_ID_PATTERN))
      .min(1)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each record must appear exactly once.",
      ),
  })
  .strict();

/**
 * Renumbering is always scoped to one parent, so the parent travels with the
 * list. Declared as its own schema rather than an extension, because a refined
 * object schema cannot be safely extended.
 */
export const productScopedOrderSchema = z
  .object({
    parentId: z.string().regex(PRODUCT_ID_PATTERN, "Choose a parent."),
    ids: z
      .array(z.string().regex(PRODUCT_ID_PATTERN))
      .min(1)
      .max(500)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each record must appear exactly once.",
      ),
  })
  .strict();
