/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/banner-api.test.cjs.
// No .env loading, no live MongoDB, no real Cloudinary requests.
const { test, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { Writable } = require("node:stream");
const sharp = require("sharp");

const ORIGIN = "https://example.test";
const FOLDER = "alliance-sourcing-bd/banners";

// ---------------------------------------------------------------- fake model
let rows;
let session;
let cloudFails;
let uploadCount;
let lastOptions;
let lastUploaded;
let databaseFails;

const hex = (n) => n.toString(16).padStart(24, "0");

function makeRow(id, values) {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    _id: id,
    title: "Title " + id,
    description: "Description " + id,
    imageUrl: "https://res.cloudinary.com/test-cloud/image/upload/v1/old.png",
    publicId: "alliance-sourcing-bd/banners/aaaaaaaa-1111-2222-3333-444444444444",
    imageAlt: "Alt " + id,
    cta: { text: "Learn more", href: "/about" },
    sortOrder: 0,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
    ...values,
  };
}

function sortRows(list) {
  return [...list].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a._id.toString().localeCompare(b._id.toString()),
  );
}

function query(filter, transform) {
  const matches = rows.filter((row) => {
    if (filter.isPublished !== undefined && row.isPublished !== filter.isPublished) {
      return false;
    }
    if (filter._id && filter._id.$in) {
      return filter._id.$in.includes(row._id.toString());
    }
    if (filter._id) return row._id.toString() === filter._id;
    return true;
  });
  return sortRows(matches).map((row) => structuredClone(row)).map(transform);
}

const identity = (row) => row;

function chainable(result) {
  return {
    sort: () => chainable(result),
    select: () => chainable(result),
    lean: () => chainable(result),
    exec: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
}

const model = {
  find: (filter) => chainable(query(filter, identity)),
  findById: (id) => chainable(query({ _id: id }, identity)),
  create: async (values) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const row = makeRow(hex(rows.length + 1), values);
    rows.push(row);
    return { toObject: () => structuredClone(row) };
  },
  findByIdAndUpdate: (id, update) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const row = rows.find((item) => item._id.toString() === id);
    if (!row) return chainable(null);
    for (const [key, value] of Object.entries(update.$set)) {
      row[key] = value;
    }
    return chainable(structuredClone(row));
  },
  deleteOne: async (filter) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const before = rows.length;
    rows = rows.filter((row) => row._id.toString() !== filter._id);
    return { deletedCount: before - rows.length };
  },
  bulkWrite: async (operations) => {
    if (databaseFails) throw new Error("Simulated write failure");
    for (const operation of operations) {
      const row = rows.find((item) => item._id.toString() === operation.updateOne.filter._id);
      row.sortOrder = operation.updateOne.update.$set.sortOrder;
    }
    return { modifiedCount: operations.length };
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/lib/admin-session") return { getAdminSession: async () => session };
  if (request === "@/lib/db") return { connectDB: async () => {} };
  if (request === "@/models/banner") return { Banner: model };
  return originalLoad.call(this, request, parent, isMain);
};

const cloudinary = require("cloudinary").v2;
const originalUpload = cloudinary.uploader.upload_stream;
cloudinary.uploader.upload_stream = (options, callback) => {
  uploadCount++;
  lastOptions = options;
  const chunks = [];
  return new Writable({
    write(chunk, encoding, done) {
      chunks.push(chunk);
      done();
    },
    final(done) {
      lastUploaded = Buffer.concat(chunks);
      if (cloudFails) callback({ http_code: 503 });
      else
        callback(null, {
          secure_url:
            "https://res.cloudinary.com/test-cloud/image/upload/v1/" +
            options.public_id +
            "." +
            options.format,
          public_id: options.folder + "/" + options.public_id,
        });
      done();
    },
  });
};

process.env.BETTER_AUTH_URL = ORIGIN;
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-only";
process.env.CLOUDINARY_API_SECRET = "test-only";

const banners = require("../src/services/banners.ts");
const {
  isAllowedBannerHref,
  bannerCreateSchema,
  bannerUpdateSchema,
  bannerOrderSchema,
} = require("../src/lib/validations/banner.ts");
const {
  wrapIndex,
  resolveIndex,
  isRotationPaused,
  AUTOPLAY_INTERVAL_MS,
} = require("../src/lib/banner-carousel-state.ts");
const { normalizeBannerImage } = require("../src/lib/banner-image.ts");
const { MAX_BANNER_BYTES } = require("../src/lib/banner-upload-limits.ts");
const { readBoundedImageFormData } = require("../src/lib/image-form-data.ts");
const createRoute = require("../src/app/api/banners/route.ts");
const idRoute = require("../src/app/api/banners/[id]/route.ts");
const orderRoute = require("../src/app/api/banners/order/route.ts");
const uploadRoute = require("../src/app/api/banners/upload/route.ts");

const ID_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ID_B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ID_C = "cccccccccccccccccccccccc";
const VALID_PUBLIC_ID = FOLDER + "/11111111-2222-3333-4444-555555555555";
const VALID_IMAGE_URL =
  "https://res.cloudinary.com/test-cloud/image/upload/v1/" +
  VALID_PUBLIC_ID.replace(/\//g, "/") +
  ".webp";

beforeEach(() => {
  rows = [
    makeRow(ID_A, { sortOrder: 1, isPublished: true, title: "Alpha" }),
    makeRow(ID_B, { sortOrder: 0, isPublished: false, title: "Beta" }),
    makeRow(ID_C, { sortOrder: 1, isPublished: true, title: "Gamma" }),
  ];
  session = { user: { email: "admin@example.test" } };
  cloudFails = databaseFails = false;
  uploadCount = 0;
});

after(() => {
  Module._load = originalLoad;
  cloudinary.uploader.upload_stream = originalUpload;
});

function jsonRequest(url, method, body, { origin = ORIGIN, contentType = "application/json" } = {}) {
  return new Request(url, {
    method,
    headers: { origin, ...(contentType ? { "content-type": contentType } : {}) },
    body: contentType ? JSON.stringify(body) : undefined,
  });
}

function uploadRequest(buffer, { origin = ORIGIN, name = "banner.txt" } = {}) {
  const form = new FormData();
  form.set("file", new File([buffer], name, { type: "text/plain" }));
  return new Request(ORIGIN + "/api/banners/upload", {
    method: "POST",
    headers: { origin },
    body: form,
  });
}

function params(id) {
  return { params: Promise.resolve({ id }) };
}

function createPayload(overrides = {}) {
  return {
    title: "Global apparel sourcing partner",
    description: "Factory audits, sampling and consolidated shipping.",
    imageAlt: "Garment factory floor",
    cta: { text: "Explore our factory", href: "/factory-machinery" },
    sortOrder: 2,
    isPublished: true,
    image: { imageUrl: VALID_IMAGE_URL, publicId: VALID_PUBLIC_ID },
    ...overrides,
  };
}

async function photo(width, height, alpha = false) {
  return sharp({
    create: {
      width,
      height,
      channels: alpha ? 4 : 3,
      background: alpha ? { r: 20, g: 90, b: 160, alpha: 0.4 } : { r: 20, g: 90, b: 160 },
    },
  })
    .png()
    .toBuffer();
}

// ------------------------------------------------------------- carousel math
test("carousel math loops, clamps and never leaves a dangling index", () => {
  assert.equal(AUTOPLAY_INTERVAL_MS, 4000);
  assert.equal(wrapIndex(3, 3), 0);
  assert.equal(wrapIndex(-1, 3), 2);
  assert.equal(wrapIndex(0, 0), 0);
  assert.equal(wrapIndex(5, 0), 0);
  assert.equal(resolveIndex(9, 3), 2);
  assert.equal(resolveIndex(0, 0), 0);
  assert.equal(resolveIndex(2, 1), 0);
});

test("rotation pauses for one slide, reduced motion, hover, focus and the pause button", () => {
  const base = {
    count: 3,
    userPaused: false,
    reducedMotion: false,
    pointerInside: false,
    focusInside: false,
  };
  assert.equal(isRotationPaused(base), false);
  assert.equal(isRotationPaused({ ...base, count: 1 }), true);
  assert.equal(isRotationPaused({ ...base, count: 0 }), true);
  assert.equal(isRotationPaused({ ...base, reducedMotion: true }), true);
  assert.equal(isRotationPaused({ ...base, pointerInside: true }), true);
  assert.equal(isRotationPaused({ ...base, focusInside: true }), true);
  assert.equal(isRotationPaused({ ...base, userPaused: true }), true);
});

// ------------------------------------------------------------ CTA validation
test("CTA destinations accept same-site paths and https URLs only", () => {
  for (const href of [
    "/",
    "/about",
    "/factory-machinery?x=1#top",
    "https://example.com/page",
    "https://example.com:8443/page",
  ]) {
    assert.equal(isAllowedBannerHref(href), true, href);
  }

  for (const href of [
    "//evil.test",
    "/\\evil.test",
    "\\/evil.test",
    "http://example.com",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "ftp://example.com",
    "mailto:a@example.test",
    "https://user:pass@example.com",
    "https://",
    "example.com",
    "",
  ]) {
    assert.equal(isAllowedBannerHref(href), false, href);
  }
});

test("create schema requires text, alt, order and a banner-folder image", () => {
  assert.equal(bannerCreateSchema.safeParse(createPayload()).success, true);
  assert.equal(bannerCreateSchema.safeParse(createPayload({ cta: null })).success, true);

  const rejected = [
    createPayload({ title: "   " }),
    createPayload({ description: "" }),
    createPayload({ imageAlt: "" }),
    createPayload({ title: "x".repeat(161) }),
    createPayload({ sortOrder: -1 }),
    createPayload({ sortOrder: 1.5 }),
    createPayload({ sortOrder: 10000 }),
    createPayload({ cta: { text: "", href: "/about" } }),
    createPayload({ cta: { text: "Go", href: "//evil.test" } }),
    createPayload({ cta: { text: "Go", href: "javascript:alert(1)" } }),
    createPayload({ image: undefined }),
    createPayload({
      image: {
        imageUrl: VALID_IMAGE_URL,
        publicId: "alliance-sourcing-bd/logos/secret",
      },
    }),
    createPayload({
      image: {
        imageUrl: "https://res.cloudinary.com/test-cloud/image/upload/../../x",
        publicId: VALID_PUBLIC_ID,
      },
    }),
    createPayload({
      image: { imageUrl: "http://res.cloudinary.com/x.webp", publicId: VALID_PUBLIC_ID },
    }),
  ];

  for (const payload of rejected) {
    assert.equal(bannerCreateSchema.safeParse(payload).success, false, JSON.stringify(payload));
  }
});

test("update schema allows a text-only patch but not an empty one", () => {
  assert.equal(bannerUpdateSchema.safeParse({ title: "New" }).success, true);
  assert.equal(bannerUpdateSchema.safeParse({ isPublished: false }).success, true);
  assert.equal(bannerUpdateSchema.safeParse({}).success, false);
  assert.equal(
    bannerUpdateSchema.safeParse({ image: { imageUrl: VALID_IMAGE_URL, publicId: "x" } }).success,
    false,
  );
  assert.equal(bannerOrderSchema.safeParse({ ids: [ID_A] }).success, true);
  assert.equal(bannerOrderSchema.safeParse({ ids: ["nope"] }).success, false);
});

// ------------------------------------------------------------------ service
test("public reader returns only published slides in stable order with string ids", async () => {
  const published = await banners.getPublishedBanners();
  assert.deepEqual(
    published.map((slide) => slide.title),
    ["Alpha", "Gamma"],
  );
  assert.equal(published[0].id, ID_A);
  assert.equal(typeof published[0].id, "string");
  assert.equal("publicId" in published[0], false);
  assert.equal("isPublished" in published[0], false);
  assert.equal(published[0].cta.href, "/about");
});

test("admin reader returns drafts too, in stable order", async () => {
  const all = await banners.getAdminBanners();
  assert.deepEqual(
    all.map((banner) => banner.title),
    ["Beta", "Alpha", "Gamma"],
  );
  assert.equal(all[0].isPublished, false);
  assert.equal(typeof all[0].createdAt, "string");
});

test("order ties break on creation time then id", () => {
  const sameTime = sortRows([
    makeRow(ID_C, { sortOrder: 0 }),
    makeRow(ID_A, { sortOrder: 0 }),
    makeRow(ID_B, { sortOrder: 0 }),
  ]);
  assert.deepEqual(
    sameTime.map((row) => row._id.toString()),
    [ID_A, ID_B, ID_C],
  );
});

test("text-only update keeps the stored image; a new image replaces both fields", async () => {
  const textOnly = await banners.updateBanner(ID_A, { title: "Alpha renamed" });
  assert.equal(textOnly.title, "Alpha renamed");
  assert.equal(textOnly.imageUrl, rows[0].imageUrl);
  assert.equal(textOnly.publicId, rows[0].publicId);

  const replaced = await banners.updateBanner(ID_A, {
    image: { imageUrl: "https://res.cloudinary.com/test-cloud/image/upload/v1/new.webp", publicId: FOLDER + "/new" },
  });
  assert.equal(replaced.imageUrl.endsWith("/new.webp"), true);
  assert.equal(replaced.publicId, FOLDER + "/new");
  assert.equal(replaced.title, "Alpha renamed", "unrelated fields survive");
});

test("update and delete report a missing record as null/false", async () => {
  assert.equal(await banners.updateBanner(hex(99), { title: "x" }), null);
  assert.equal(await banners.deleteBanner(hex(99)), false);
  assert.equal(await banners.deleteBanner(ID_A), true);
  assert.equal(rows.length, 2);
});

test("reorder rewrites sortOrder and refuses a partial id list", async () => {
  assert.equal(await banners.reorderBanners([ID_C, ID_A, ID_B]), true);
  assert.deepEqual(
    (await banners.getAdminBanners()).map((banner) => [banner.title, banner.sortOrder]),
    [
      ["Gamma", 0],
      ["Alpha", 1],
      ["Beta", 2],
    ],
  );
  assert.equal(await banners.reorderBanners([ID_A, hex(99)]), false);
});

// ----------------------------------------------------------------- API: post
test("creating a banner is refused before any read when unauthenticated or off-origin", async () => {
  session = null;
  const unauth = await createRoute.POST(jsonRequest(ORIGIN + "/api/banners", "POST", createPayload()));
  assert.equal(unauth.status, 401);

  session = {};
  assert.equal((await createRoute.POST(jsonRequest(ORIGIN + "/api/banners", "POST", createPayload(), { origin: "https://attacker.test" }))).status, 403);
  assert.equal((await createRoute.POST(jsonRequest(ORIGIN + "/api/banners", "POST", createPayload(), { contentType: null }))).status, 415);
  assert.equal(rows.length, 3);
});

test("create rejects invalid JSON, unsafe CTA values and unknown image folders", async () => {
  const badJson = new Request(ORIGIN + "/api/banners", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: "{",
  });
  assert.equal((await createRoute.POST(badJson)).status, 400);

  const unsafe = await createRoute.POST(
    jsonRequest(ORIGIN + "/api/banners", "POST", createPayload({ cta: { text: "Go", href: "javascript:alert(1)" } })),
  );
  assert.equal(unsafe.status, 400);
  assert.match((await unsafe.json()).message, /site path|https/i);

  const foreign = await createRoute.POST(
    jsonRequest(ORIGIN + "/api/banners", "POST", createPayload({ image: { imageUrl: "https://res.cloudinary.com/test-cloud/image/upload/v1/x.png", publicId: "somewhere/else" } })),
  );
  assert.equal(foreign.status, 400);
  assert.equal(rows.length, 3);
});

test("create stores a new published banner and returns it as plain data", async () => {
  const response = await createRoute.POST(
    jsonRequest(ORIGIN + "/api/banners", "POST", createPayload()),
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.banner.title, "Global apparel sourcing partner");
  assert.equal(body.banner.isPublished, true);
  assert.equal(typeof body.banner.id, "string");
  assert.equal(rows.length, 4);
  assert.equal(rows[3].imageUrl, VALID_IMAGE_URL);
});

// ---------------------------------------------------------------- API: [id]
test("invalid record ids never reach the database", async () => {
  for (const id of ["nope", "..", "%2e%2e", "a".repeat(25), "1".repeat(23)]) {
    const response = await idRoute.PATCH(jsonRequest(ORIGIN + "/api/banners/" + id, "PATCH", { title: "x" }), params(id));
    assert.equal(response.status, 400, id);
  }
  assert.equal(rows.length, 3);
});

test("patch, unpublish and delete act on the record and 404 when it is gone", async () => {
  const saved = await idRoute.PATCH(
    jsonRequest(ORIGIN + "/api/banners/" + ID_A, "PATCH", { title: "Alpha two", isPublished: false }),
    params(ID_A),
  );
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).banner.isPublished, false);
  assert.equal(rows[0].imageUrl.startsWith("https://res.cloudinary.com"), true);

  assert.equal((await idRoute.PATCH(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "PATCH", { cta: { text: "x", href: "//evil.test" } }), params(ID_A))).status, 400);
  assert.equal((await idRoute.DELETE(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "DELETE", {}), params(ID_A))).status, 200);
  assert.equal((await idRoute.DELETE(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "DELETE", {}), params(ID_A))).status, 404);
});

test("delete works with the exact headers a browser sends (no body, no content type)", async () => {
  const browserDelete = new Request(ORIGIN + "/api/banners/" + ID_B, {
    method: "DELETE",
    headers: { origin: ORIGIN, cookie: "better-auth.session_token=test" },
  });
  assert.equal(browserDelete.headers.get("content-type"), null);

  const response = await idRoute.DELETE(browserDelete, params(ID_B));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).message, "Banner deleted.");
  assert.equal(rows.length, 2);

  // Still fully protected: auth and origin are checked without a content type.
  session = null;
  assert.equal((await idRoute.DELETE(new Request(ORIGIN + "/api/banners/" + ID_A, { method: "DELETE", headers: { origin: ORIGIN } }), params(ID_A))).status, 401);
  session = {};
  assert.equal((await idRoute.DELETE(new Request(ORIGIN + "/api/banners/" + ID_A, { method: "DELETE", headers: { origin: "https://attacker.test" } }), params(ID_A))).status, 403);
  assert.equal(rows.length, 2);
  assert.equal((await idRoute.DELETE(new Request(ORIGIN + "/api/banners/not-an-id", { method: "DELETE", headers: { origin: ORIGIN } }), params("not-an-id"))).status, 400);
});

test("a body-carrying mutation still refuses anything that is not JSON", async () => {
  const formLike = new Request(ORIGIN + "/api/banners", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "text/plain" },
    body: "title=nope",
  });
  assert.equal((await createRoute.POST(formLike)).status, 415);
  const patchLike = new Request(ORIGIN + "/api/banners/" + ID_A, {
    method: "PATCH",
    headers: { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded" },
    body: "title=nope",
  });
  assert.equal((await idRoute.PATCH(patchLike, params(ID_A))).status, 415);
  assert.equal(rows.length, 3);
});

test("every mutation authorises independently", async () => {
  session = null;
  const patch = await idRoute.PATCH(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "PATCH", { title: "x" }), params(ID_A));
  const remove = await idRoute.DELETE(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "DELETE", {}), params(ID_A));
  const order = await orderRoute.PUT(jsonRequest(ORIGIN + "/api/banners/order", "PUT", { ids: [ID_A] }));
  const upload = await uploadRoute.POST(uploadRequest(Buffer.from("nope")));
  for (const response of [patch, remove, order, upload]) assert.equal(response.status, 401);

  session = {};
  assert.equal((await idRoute.PATCH(jsonRequest(ORIGIN + "/api/banners/" + ID_A, "PATCH", { title: "x" }, { origin: "https://attacker.test" }), params(ID_A))).status, 403);
  assert.equal((await orderRoute.PUT(jsonRequest(ORIGIN + "/api/banners/order", "PUT", { ids: [ID_A] }, { origin: "https://attacker.test" }))).status, 403);
  assert.equal((await uploadRoute.POST(uploadRequest(Buffer.from("nope"), { origin: "https://attacker.test" }))).status, 403);
  assert.equal(rows.length, 3);
  assert.equal(uploadCount, 0);
});

// --------------------------------------------------------------- API: order
test("order endpoint validates duplicates and missing records", async () => {
  assert.equal((await orderRoute.PUT(jsonRequest(ORIGIN + "/api/banners/order", "PUT", { ids: [ID_A, ID_A] }))).status, 400);
  assert.equal((await orderRoute.PUT(jsonRequest(ORIGIN + "/api/banners/order", "PUT", { ids: [ID_A, hex(99)] }))).status, 409);
  const ok = await orderRoute.PUT(jsonRequest(ORIGIN + "/api/banners/order", "PUT", { ids: [ID_C, ID_B, ID_A] }));
  assert.equal(ok.status, 200);
  assert.deepEqual((await banners.getAdminBanners()).map((b) => b.title), ["Gamma", "Beta", "Alpha"]);
});

// ------------------------------------------------------------- banner image
test("banner images are capped at 2560px, never enlarged and never cropped", async () => {
  const wide = await normalizeBannerImage(await photo(3000, 1200));
  const meta = await sharp(wide.buffer).metadata();
  assert.equal(meta.width, 2560);
  assert.equal(meta.height, 1024);
  assert.equal(wide.format, "webp");

  const small = await normalizeBannerImage(await photo(640, 360));
  const smallMeta = await sharp(small.buffer).metadata();
  assert.equal(smallMeta.width, 640);
  assert.equal(smallMeta.height, 360);
  assert.equal(smallMeta.format, "webp");
});

test("transparent sources keep transparency by falling back to PNG", async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="none"/><circle cx="200" cy="100" r="60" fill="red"/></svg>',
  );
  const result = await normalizeBannerImage(svg);
  assert.equal(result.format, "png");
  const meta = await sharp(result.buffer).metadata();
  assert.equal(meta.format, "png");
  assert.equal(meta.width, 400);
  assert.equal(meta.hasAlpha, true);
});

test("oversized, animated, unsafe-SVG and non-image uploads are refused", async () => {
  await assert.rejects(normalizeBannerImage(Buffer.alloc(0)), { status: 400 });
  await assert.rejects(normalizeBannerImage(Buffer.alloc(MAX_BANNER_BYTES + 1)), { status: 413 });
  const frames = Buffer.from([
    ...Array(4).fill([255, 0, 0]).flat(),
    ...Array(4).fill([0, 0, 255]).flat(),
  ]);
  const animated = await sharp(frames, {
    raw: { width: 2, height: 4, pageHeight: 2, channels: 3 },
  })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);

  for (const input of [
    Buffer.from("not an image"),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://x.test/a.png"/></svg>'),
    Buffer.from('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>'),
    animated,
  ]) {
    await assert.rejects(normalizeBannerImage(input), { status: 415 });
  }
});

// -------------------------------------------------------------- API: upload
test("upload stores the banner in its own Cloudinary folder with a unique id", async () => {
  const response = await uploadRoute.POST(uploadRequest(await photo(800, 400)));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.image.publicId.startsWith(FOLDER + "/"), true);
  assert.equal(body.image.imageUrl.startsWith("https://res.cloudinary.com/test-cloud/image/upload/"), true);
  assert.equal(lastOptions.folder, FOLDER);
  assert.equal(lastOptions.format, "webp");
  assert.equal(lastOptions.overwrite, false);
  assert.equal((await sharp(lastUploaded).metadata()).format, "webp");

  const first = body.image.publicId;
  const second = await (await uploadRoute.POST(uploadRequest(await photo(800, 400)))).json();
  assert.notEqual(second.image.publicId, first);
});

test("a failed upload never touches the saved record", async () => {
  cloudFails = true;
  const response = await uploadRoute.POST(uploadRequest(await photo(800, 400)));
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /unchanged/i);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].imageUrl.startsWith("https://res.cloudinary.com"), true);
  assert.equal(uploadCount, 1);
});

test("bounded multipart reading rejects oversized and dishonest bodies", async () => {
  const body = new Uint8Array(MAX_BANNER_BYTES + 64 * 1024 + 1);
  for (const headers of [
    {},
    { "content-length": "5" },
    { "content-length": String(body.length) },
  ]) {
    const request = new Request(ORIGIN, {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=x", ...headers },
      body,
    });
    await assert.rejects(readBoundedImageFormData(request, { maxBytes: MAX_BANNER_BYTES, extraFields: [], sizeMessage: "too big" }), { status: 413 });
  }
  await assert.rejects(
    readBoundedImageFormData(new Request(ORIGIN, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), { maxBytes: MAX_BANNER_BYTES, extraFields: [], sizeMessage: "x" }),
    { status: 415 },
  );
});

test("a database failure during save is reported without destructive cleanup", async () => {
  databaseFails = true;
  const response = await createRoute.POST(jsonRequest(ORIGIN + "/api/banners", "POST", createPayload()));
  assert.equal(response.status, 500);
  assert.equal(rows.length, 3);
});
