/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/machinery-schema.test.cjs.
// No DOM, no timers, no network, no .env loading.
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MACHINERY_ID_PATTERN,
  machineryCategoryCreateSchema,
  machineryCategoryUpdateSchema,
  machineryItemCreateSchema,
  machineryItemUpdateSchema,
  machineryOrderSchema,
  machineryItemOrderSchema,
  factoryPdfSchema,
  factoryPdfSaveSchema,
  MAX_FACTORY_PDF_BYTES,
  FACTORY_PDF_SIZE_MESSAGE,
} = require("@/lib/validations/machinery");

const CLOUD = "drdsszsms";
process.env.CLOUDINARY_CLOUD_NAME = CLOUD;

const ID = "a".repeat(24);
const OTHER_ID = "b".repeat(24);
const FOLDER = "alliance-sourcing-bd/documents";
const pdf = (publicId = "alliance-sourcing-bd/documents/factory-profile1") => ({
  url: `https://res.cloudinary.com/${CLOUD}/raw/upload/v1/${publicId}.pdf`,
  publicId,
  fileName: "factory-profile.pdf",
});

const category = { name: "Cutting Machinery", slug: "cutting-machinery", sortOrder: 0 };
const item = {
  categoryId: ID,
  slNo: 1,
  machineName: "Band Knife Machine1",
  brand: "Open",
  quantity: 2,
  sortOrder: 0,
};

/* ---------------------------------- ids ---------------------------------- */

test("an id is a 24-character hex string", () => {
  assert.equal(MACHINERY_ID_PATTERN.test(ID), true);
  assert.equal(MACHINERY_ID_PATTERN.test("nope"), false);
  assert.equal(MACHINERY_ID_PATTERN.test("z".repeat(24)), false);
  assert.equal(MACHINERY_ID_PATTERN.test(`${ID}0`), false);
});

/* ------------------------------- categories ------------------------------- */

test("accepts a complete category", () => {
  const r = machineryCategoryCreateSchema.safeParse(category);
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("a category name is required", () => {
  assert.equal(machineryCategoryCreateSchema.safeParse({ ...category, name: "   " }).success, false);
});

test("a slug must be lowercase words joined by single hyphens", () => {
  for (const slug of ["Cutting Machinery", "cutting_machinery", "cutting--machinery", "-cutting", ""]) {
    assert.equal(
      machineryCategoryCreateSchema.safeParse({ ...category, slug }).success,
      false,
      slug,
    );
  }
  assert.equal(
    machineryCategoryCreateSchema.safeParse({ ...category, slug: "cutting-machinery-2" }).success,
    true,
  );
});

test("a slug is normalised to lowercase rather than rejected for case", () => {
  const r = machineryCategoryCreateSchema.safeParse({ ...category, slug: "Cutting-Machinery" });
  assert.equal(r.data.slug, "cutting-machinery");
});

test("an unknown category field is rejected", () => {
  assert.equal(machineryCategoryCreateSchema.safeParse({ ...category, total: 99 }).success, false);
});

test("a category update needs at least one field", () => {
  assert.equal(machineryCategoryUpdateSchema.safeParse({}).success, false);
  assert.equal(machineryCategoryUpdateSchema.safeParse({ name: "Finishing" }).success, true);
});

test("a display order outside 0-9999 is rejected", () => {
  assert.equal(machineryCategoryCreateSchema.safeParse({ ...category, sortOrder: -1 }).success, false);
  assert.equal(machineryCategoryCreateSchema.safeParse({ ...category, sortOrder: 10000 }).success, false);
  assert.equal(machineryCategoryCreateSchema.safeParse({ ...category, sortOrder: 1.5 }).success, false);
});

/* --------------------------------- items ---------------------------------- */

test("accepts a complete machine", () => {
  const r = machineryItemCreateSchema.safeParse(item);
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("a machine needs a category that exists as an id", () => {
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, categoryId: "cutting" }).success, false);
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, categoryId: "" }).success, false);
});

test("a machine name is required", () => {
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, machineName: "  " }).success, false);
});

test("a brand may be omitted, empty or null, because 'Open' is a real value", () => {
  for (const brand of [undefined, "", null, "Open"]) {
    assert.equal(machineryItemCreateSchema.safeParse({ ...item, brand }).success, true, String(brand));
  }
});

test("a negative or fractional quantity is rejected", () => {
  for (const quantity of [-1, 1.5]) {
    assert.equal(machineryItemCreateSchema.safeParse({ ...item, quantity }).success, false, String(quantity));
  }
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, quantity: 0 }).success, true);
});

test("a row number starts at 1", () => {
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, slNo: 0 }).success, false);
  assert.equal(machineryItemCreateSchema.safeParse({ ...item, slNo: 1 }).success, true);
});

test("a machine update needs at least one field", () => {
  assert.equal(machineryItemUpdateSchema.safeParse({}).success, false);
  assert.equal(machineryItemUpdateSchema.safeParse({ quantity: 4 }).success, true);
});

test("a machine update can move it to another category", () => {
  const r = machineryItemUpdateSchema.safeParse({ categoryId: OTHER_ID });
  assert.equal(r.success, true);
  assert.equal(r.data.categoryId, OTHER_ID);
});

/* -------------------------------- ordering -------------------------------- */

test("a reorder must list every id exactly once", () => {
  assert.equal(machineryOrderSchema.safeParse({ ids: [ID, OTHER_ID] }).success, true);
  assert.equal(machineryOrderSchema.safeParse({ ids: [ID, ID] }).success, false);
  assert.equal(machineryOrderSchema.safeParse({ ids: [] }).success, false);
  assert.equal(machineryOrderSchema.safeParse({ ids: ["nope"] }).success, false);
});

test("a machine reorder also names the category it applies to", () => {
  assert.equal(machineryItemOrderSchema.safeParse({ categoryId: ID, ids: [ID] }).success, true);
  // Without the category the server cannot scope the renumbering.
  assert.equal(machineryItemOrderSchema.safeParse({ ids: [ID] }).success, false);
  assert.equal(machineryItemOrderSchema.safeParse({ categoryId: "cutting", ids: [ID] }).success, false);
  assert.equal(machineryItemOrderSchema.safeParse({ categoryId: ID, ids: [ID, ID] }).success, false);
});

/* ----------------------------- the PDF record ----------------------------- */

test("the PDF limit is 10 MB", () => {
  assert.equal(MAX_FACTORY_PDF_BYTES, 10 * 1024 * 1024);
  assert.match(FACTORY_PDF_SIZE_MESSAGE, /10 MB/);
});

test("accepts a genuine factory PDF upload", () => {
  const r = factoryPdfSchema.safeParse(pdf());
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("a PDF is delivered as a raw asset, so an image path is rejected", () => {
  const wrong = {
    url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${FOLDER}/factory-profile1.pdf`,
    publicId: `${FOLDER}/factory-profile1`,
    fileName: "factory-profile.pdf",
  };
  assert.equal(factoryPdfSchema.safeParse(wrong).success, false);
});

test("rejects a publicId from another folder (cross-folder guard)", () => {
  const r = factoryPdfSchema.safeParse(pdf("alliance-sourcing-bd/page-banners/abcdefgh-1234"));
  assert.equal(r.success, false);
});

test("rejects a non-Cloudinary host", () => {
  const r = factoryPdfSchema.safeParse({
    ...pdf(),
    url: "https://evil.example.com/factory-profile1.pdf",
  });
  assert.equal(r.success, false);
});

test("rejects a url whose publicId does not match the path", () => {
  const r = factoryPdfSchema.safeParse({
    ...pdf(`${FOLDER}/factory-profile1`),
    url: `https://res.cloudinary.com/${CLOUD}/raw/upload/v1/${FOLDER}/somebody-elses1.pdf`,
  });
  assert.equal(r.success, false);
});

test("rejects a url carrying a query string", () => {
  const r = factoryPdfSchema.safeParse({
    ...pdf(),
    url: `${pdf().url}?att=attachment`,
  });
  assert.equal(r.success, false);
});

test("a PDF save must carry the pdf key, so a no-op cannot report success", () => {
  assert.equal(factoryPdfSaveSchema.safeParse({}).success, false);
  assert.equal(factoryPdfSaveSchema.safeParse({ pdf: null }).success, true);
  assert.equal(factoryPdfSaveSchema.safeParse({ pdf: pdf() }).success, true);
});

test("without a configured cloud name no PDF can be accepted", () => {
  const previous = process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  try {
    assert.equal(factoryPdfSchema.safeParse(pdf()).success, false);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = previous;
  }
});
