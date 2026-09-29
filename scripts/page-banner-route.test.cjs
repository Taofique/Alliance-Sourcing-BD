/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/page-banner-route.test.cjs.
// No DOM, no timers, no network. `next/cache` and the service are stubbed; only
// the request contract is under test.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/cache") {
    return { revalidatePath: () => {}, revalidateTag: () => {} };
  }
  if (request === "@/lib/admin-api") {
    return {
      readJsonBody: async (req) => {
        try {
          return { body: JSON.parse(await req.text()), error: null };
        } catch {
          return {
            body: undefined,
            error: Response.json({ message: "bad" }, { status: 400 }),
          };
        }
      },
      rejectUnauthorizedAdminWrite: async () => null,
    };
  }
  if (request === "@/services/page-banners") {
    return {
      updatePageBanner: async (page, image) => {
        globalThis.__pageWrite = { page, image };
        return globalThis.__pageWriteOk !== false;
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { PATCH } = require("@/app/api/page-banners/[page]/route");

const params = (page = "about") => ({ params: Promise.resolve({ page }) });

function post(body) {
  return new Request("https://example.test/api/page-banners/about", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const OWN = {
  imageUrl:
    "https://res.cloudinary.com/test-cloud/image/upload/v1/alliance-sourcing-bd/page-banners/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
  publicId:
    "alliance-sourcing-bd/page-banners/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
};

test("an empty body is rejected instead of reporting a successful no-op", async () => {
  globalThis.__pageWrite = "not-called";

  const res = await PATCH(post({}), params());
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.match(body.message, /No image was supplied/i);
  assert.equal(globalThis.__pageWrite, "not-called");
});

test("a body that is not an object is rejected", async () => {
  assert.equal((await PATCH(post("nope"), params())).status, 400);
});

test("null is accepted and reported as saved", async () => {
  globalThis.__pageWrite = "not-called";

  const res = await PATCH(post({ image: null }), params());
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(globalThis.__pageWrite, { page: "about", image: null });
  assert.match(body.message, /saved/i);
});

test("a valid upload is written against the page's own document", async () => {
  globalThis.__pageWrite = "not-called";

  const res = await PATCH(post({ image: OWN }), params());
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(globalThis.__pageWrite, { page: "about", image: OWN });
  assert.match(body.message, /saved/i);
});

test("an image from the wrong Cloudinary folder is rejected, not saved", async () => {
  globalThis.__pageWrite = "not-called";

  const res = await PATCH(
    post({
      image: {
        imageUrl:
          "https://res.cloudinary.com/test-cloud/image/upload/v1/alliance-sourcing-bd/footer-cta/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
        publicId:
          "alliance-sourcing-bd/footer-cta/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
    }),
    params(),
  );

  assert.equal(res.status, 400);
  assert.equal(globalThis.__pageWrite, "not-called");
});

test("a page with no banner editor is rejected before any write", async () => {
  globalThis.__pageWrite = "not-called";

  const res = await PATCH(post({ image: null }), params("not-a-real-page"));

  assert.equal(res.status, 404);
  assert.match((await res.json()).message, /no banner editor/i);
  assert.equal(globalThis.__pageWrite, "not-called");
});

test("a failed write is reported as 500, not as success", async () => {
  globalThis.__pageWriteOk = false;
  try {
    const res = await PATCH(post({ image: null }), params());
    assert.equal(res.status, 500);
    assert.doesNotMatch((await res.json()).message, /^saved$/i);
  } finally {
    globalThis.__pageWriteOk = true;
  }
});
