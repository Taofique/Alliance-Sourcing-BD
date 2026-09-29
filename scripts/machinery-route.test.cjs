/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/machinery-route.test.cjs.
// No DOM, no timers, no network. `next/cache` and the service are stubbed; only
// the request contract is under test.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");

const ID = "a".repeat(24);
const OTHER_ID = "b".repeat(24);
const CATEGORY = { id: ID, name: "Cutting Machinery", slug: "cutting-machinery", sortOrder: 0, itemCount: 6, total: 20, createdAt: "", updatedAt: "" };
const MACHINE = { id: OTHER_ID, categoryId: ID, slNo: 1, machineName: "Band Knife Machine1", brand: "Open", quantity: 2, sortOrder: 0, createdAt: "", updatedAt: "" };

/* ------------------------------- test doubles ------------------------------ */

const calls = { revalidated: [], writes: {} };
let serviceState = {};

function reset() {
  calls.revalidated = [];
  calls.writes = {};
  serviceState = {};
  globalThis.__adminDenied = null;
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/cache") {
    return {
      revalidatePath: (path) => calls.revalidated.push(path),
      revalidateTag: () => {},
    };
  }
  if (request === "@/lib/admin-api") {
    return {
      readJsonBody: async (req) => {
        try {
          return { body: JSON.parse(await req.text()), error: null };
        } catch {
          return {
            body: undefined,
            error: Response.json({ message: "Invalid JSON." }, { status: 400 }),
          };
        }
      },
      rejectUnauthorizedAdminWrite: async (_req, options) => {
        globalThis.__adminOptions = options;
        return globalThis.__adminDenied ?? null;
      },
    };
  }
  if (request === "@/services/machinery") {
    return {
      getMachineryInventory: async () => ({ categories: [], grandTotal: 0 }),
      getAdminMachineryCategories: async () => serviceState.categories ?? [CATEGORY],
      getAdminMachineryItems: async () => serviceState.items ?? [MACHINE],
      createMachineryCategory: async (input) => {
        calls.writes.category = input;
        if (serviceState.duplicate) {
          const error = new Error("E11000 duplicate key error");
          error.code = 11000;
          error.keyPattern = { [serviceState.duplicate]: 1 };
          throw error;
        }
        return { ...CATEGORY, ...input };
      },
      updateMachineryCategory: async (id, input) => {
        calls.writes.categoryUpdate = { id, input };
        return serviceState.missing ? null : { ...CATEGORY, ...input };
      },
      deleteMachineryCategory: async (id) => {
        calls.writes.categoryDelete = id;
        return serviceState.missing ? null : true;
      },
      reorderMachineryCategories: async (ids) => {
        calls.writes.categoryOrder = ids;
        return serviceState.conflict ? null : ids.map((id, sortOrder) => ({ ...CATEGORY, id, sortOrder }));
      },
      createMachineryItem: async (input) => {
        calls.writes.item = input;
        return serviceState.missingCategory ? null : { ...MACHINE, ...input };
      },
      updateMachineryItem: async (id, input) => {
        calls.writes.itemUpdate = { id, input };
        return serviceState.missing ? null : { ...MACHINE, ...input };
      },
      deleteMachineryItem: async (id) => {
        calls.writes.itemDelete = id;
        return serviceState.missing ? null : true;
      },
      reorderMachineryItems: async (categoryId, ids) => {
        calls.writes.itemOrder = { categoryId, ids };
        return serviceState.conflict ? null : ids.map((id, sortOrder) => ({ ...MACHINE, id, sortOrder, slNo: sortOrder + 1 }));
      },
      getFactoryPdf: async () => serviceState.pdf ?? null,
      saveFactoryPdf: async (pdf) => {
        calls.writes.pdf = pdf;
        return pdf;
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const routes = {
  categories: require("@/app/api/machinery/categories/route"),
  categoryOrder: require("@/app/api/machinery/categories/order/route"),
  category: require("@/app/api/machinery/categories/[id]/route"),
  items: require("@/app/api/machinery/items/route"),
  itemOrder: require("@/app/api/machinery/items/order/route"),
  item: require("@/app/api/machinery/items/[id]/route"),
  inventory: require("@/app/api/machinery/inventory/route"),
  factoryPdf: require("@/app/api/machinery/factory-pdf/route"),
};

const { describeMachineryDuplicate } = require("@/lib/machinery-duplicate");

/* --------------------------------- helpers -------------------------------- */

function send(method, body) {
  return new Request("https://example.test/api/machinery", {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}
const sendAt = (path, method, body) =>
  new Request(`https://example.test/api/machinery${path}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });

const context = (id) => ({ params: Promise.resolve({ id }) });
const validCategory = { name: "Cutting Machinery", slug: "cutting-machinery", sortOrder: 0 };
const validItem = { categoryId: ID, slNo: 1, machineName: "Band Knife Machine1", brand: "Open", quantity: 2, sortOrder: 0 };

/* --------------------------------- reads ---------------------------------- */

test("the public inventory is readable and reports no error", async () => {
  reset();
  const response = await routes.inventory.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { inventory: { categories: [], grandTotal: 0 } });
});

test("the admin category and machine lists are readable", async () => {
  reset();
  assert.equal((await routes.categories.GET()).status, 200);
  assert.equal((await routes.items.GET(send("GET"))).status, 200);
});

test("a hand-edited category filter is rejected before any lookup", async () => {
  reset();
  const response = await routes.items.GET(sendAt("/items?categoryId=cutting", "GET"));
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /category/i);
});

/* ------------------------------- categories ------------------------------- */

test("a valid category is created, and the public page is revalidated", async () => {
  reset();
  const response = await routes.categories.POST(send("POST", validCategory));
  assert.equal(response.status, 201);
  assert.deepEqual(calls.writes.category, validCategory);
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("an invalid category reports the first problem, not a generic failure", async () => {
  reset();
  const response = await routes.categories.POST(send("POST", { ...validCategory, slug: "Bad Slug" }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /hyphens/);
  assert.deepEqual(calls.revalidated, []);
});

test("a duplicate category name is a 409 that names the field", async () => {
  reset();
  serviceState.duplicate = "name";
  const response = await routes.categories.POST(send("POST", validCategory));
  assert.equal(response.status, 409);
  assert.match((await response.json()).message, /name already exists/);
});

test("a duplicate slug is a 409 that names the slug", async () => {
  reset();
  serviceState.duplicate = "slug";
  const response = await routes.categories.POST(send("POST", validCategory));
  assert.equal(response.status, 409);
  assert.match((await response.json()).message, /slug already exists/);
});

test("a category update passes only the sent fields", async () => {
  reset();
  const response = await routes.category.PATCH(sendAt(`/categories/${ID}`, "PATCH", { name: "Finishing Machinery" }), context(ID));
  assert.equal(response.status, 200);
  assert.deepEqual(calls.writes.categoryUpdate, { id: ID, input: { name: "Finishing Machinery" } });
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("a category that no longer exists is a 404", async () => {
  reset();
  serviceState.missing = true;
  const response = await routes.category.PATCH(sendAt(`/categories/${ID}`, "PATCH", { name: "Finishing" }), context(ID));
  assert.equal(response.status, 404);
});

test("a malformed id is refused before the database is touched", async () => {
  reset();
  const response = await routes.category.PATCH(sendAt("/categories/nope", "PATCH", { name: "Finishing" }), context("nope"));
  assert.equal(response.status, 400);
  assert.equal(calls.writes.categoryUpdate, undefined);
});

test("deleting a category cascades and revalidates", async () => {
  reset();
  const response = await routes.category.DELETE(sendAt(`/categories/${ID}`, "DELETE"), context(ID));
  assert.equal(response.status, 200);
  assert.match((await response.json()).message, /machines deleted/);
  assert.equal(calls.writes.categoryDelete, ID);
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("a browser DELETE carries no content type, so JSON is not demanded", async () => {
  reset();
  await routes.category.DELETE(sendAt(`/categories/${ID}`, "DELETE"), context(ID));
  assert.deepEqual(globalThis.__adminOptions, { requireJson: false });
});

test("a category reorder must be given every category", async () => {
  reset();
  const ok = await routes.categoryOrder.PUT(sendAt("/categories/order", "PUT", { ids: [ID, OTHER_ID] }));
  assert.equal(ok.status, 200);
  assert.deepEqual(calls.writes.categoryOrder, [ID, OTHER_ID]);
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);

  reset();
  serviceState.conflict = true;
  const stale = await routes.categoryOrder.PUT(sendAt("/categories/order", "PUT", { ids: [ID, OTHER_ID] }));
  assert.equal(stale.status, 409);
  assert.match((await stale.json()).message, /Reload before reordering/);
});

/* --------------------------------- items ---------------------------------- */

test("a valid machine is created", async () => {
  reset();
  const response = await routes.items.POST(send("POST", validItem));
  assert.equal(response.status, 201);
  assert.deepEqual(calls.writes.item, validItem);
});

test("a machine cannot be added to a category that has gone", async () => {
  reset();
  serviceState.missingCategory = true;
  const response = await routes.items.POST(send("POST", validItem));
  assert.equal(response.status, 404);
  assert.match((await response.json()).message, /category no longer exists/);
});

test("a negative quantity never reaches the service", async () => {
  reset();
  const response = await routes.items.POST(send("POST", { ...validItem, quantity: -1 }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /negative/);
  assert.equal(calls.writes.item, undefined);
});

test("a machine can be moved to another category", async () => {
  reset();
  const response = await routes.item.PATCH(sendAt(`/items/${ID}`, "PATCH", { categoryId: OTHER_ID }), context(ID));
  assert.equal(response.status, 200);
  assert.deepEqual(calls.writes.itemUpdate, { id: ID, input: { categoryId: OTHER_ID } });
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("a machine delete is reported and revalidates", async () => {
  reset();
  const response = await routes.item.DELETE(sendAt(`/items/${ID}`, "DELETE"), context(ID));
  assert.equal(response.status, 200);
  assert.equal(calls.writes.itemDelete, ID);
  assert.deepEqual(globalThis.__adminOptions, { requireJson: false });
});

test("a machine reorder is scoped to its category", async () => {
  reset();
  const response = await routes.itemOrder.PUT(sendAt("/items/order", "PUT", { categoryId: ID, ids: [OTHER_ID, ID] }));
  assert.equal(response.status, 200);
  assert.deepEqual(calls.writes.itemOrder, { categoryId: ID, ids: [OTHER_ID, ID] });
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("a machine reorder without a category is refused", async () => {
  reset();
  const response = await routes.itemOrder.PUT(sendAt("/items/order", "PUT", { ids: [ID] }));
  assert.equal(response.status, 400);
  assert.equal(calls.writes.itemOrder, undefined);
});

test("a reordered list that no longer matches the category is a 409", async () => {
  reset();
  serviceState.conflict = true;
  const response = await routes.itemOrder.PUT(sendAt("/items/order", "PUT", { categoryId: ID, ids: [ID] }));
  assert.equal(response.status, 409);
});

/* -------------------------------- the PDF --------------------------------- */

test("a PDF save without the pdf key is refused, so a no-op cannot report success", async () => {
  reset();
  const response = await routes.factoryPdf.PATCH(sendAt("/factory-pdf", "PATCH", { note: "hello" }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /No document was supplied/);
  assert.equal(calls.writes.pdf, undefined);
  assert.deepEqual(calls.revalidated, []);
});

test("a PDF save revalidates the public page", async () => {
  reset();
  const response = await routes.factoryPdf.PATCH(sendAt("/factory-pdf", "PATCH", { pdf: null }));
  assert.equal(response.status, 200);
  assert.equal(calls.writes.pdf, null);
  assert.match((await response.json()).message, /removed/);
  assert.deepEqual(calls.revalidated, ["/factory-machinery"]);
});

test("a PDF reference that was never uploaded is refused", async () => {
  reset();
  const response = await routes.factoryPdf.PATCH(
    sendAt("/factory-pdf", "PATCH", {
      pdf: { url: "https://example.com/x.pdf", publicId: "alliance-sourcing-bd/documents/x", fileName: "x.pdf" },
    }),
  );
  assert.equal(response.status, 400);
});

/* ------------------------------- authorisation ----------------------------- */

test("an unauthenticated write is refused before the body is read", async () => {
  reset();
  globalThis.__adminDenied = Response.json({ message: "Admin authentication required." }, { status: 401 });

  for (const [label, response] of [
    ["create category", await routes.categories.POST(send("POST", validCategory))],
    ["add machine", await routes.items.POST(send("POST", validItem))],
    ["save PDF", await routes.factoryPdf.PATCH(sendAt("/factory-pdf", "PATCH", { pdf: null }))],
    ["delete category", await routes.category.DELETE(sendAt(`/categories/${ID}`, "DELETE"), context(ID))],
  ]) {
    assert.equal(response.status, 401, label);
  }

  assert.deepEqual(calls.writes, {});
  assert.deepEqual(calls.revalidated, []);
});

/* ------------------------- the duplicate-key mapping ----------------------- */

test("a duplicate-key error names the field that collided", () => {
  const withPattern = (keyPattern) =>
    Object.assign(new Error("E11000"), { code: 11000, keyPattern });

  assert.match(describeMachineryDuplicate(withPattern({ name: 1 })), /name already exists/);
  assert.match(describeMachineryDuplicate(withPattern({ slug: 1 })), /slug already exists/);
  assert.match(describeMachineryDuplicate(withPattern({ _id: 1 })), /already exists/);
});

test("anything that is not a duplicate key error is left alone", () => {
  assert.equal(describeMachineryDuplicate(new Error("network")), null);
  assert.equal(describeMachineryDuplicate(null), null);
  assert.equal(describeMachineryDuplicate({ code: 121 }), null);
  assert.equal(describeMachineryDuplicate("11000"), null);
});
