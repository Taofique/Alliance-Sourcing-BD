/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/faq-route.test.cjs.
// The model and the admin session are stubbed: no Mongo, no network, no .env loading.
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const hex = (n) => n.toString(16).padStart(24, "0");
const ORIGIN = "https://example.test";
// admin-api compares the request origin against this, so it has to be present.
process.env.BETTER_AUTH_URL = ORIGIN;

let rows = [];
let databaseFails = false;
let session = { userId: "admin-1" };
let queries = [];

/** The stub stands in for a Mongoose query: sortable, lean-able, awaitable. */
function chainable(result, sort) {
  return {
    sort: (spec) => chainable(result, spec),
    select: () => chainable(result, sort),
    lean: () => chainable(applySort(result, sort), undefined),
    then: (resolve, reject) =>
      Promise.resolve(applySort(result, sort)).then(resolve, reject),
  };
}

/** Mirrors the `{ sortOrder: 1, createdAt: 1, _id: 1 }` ordering the service uses. */
function applySort(result, sort) {
  if (!sort || !Array.isArray(result)) return result;
  const keys = Object.keys(sort);
  return [...result].sort((a, b) => {
    for (const key of keys) {
      const left = key === "_id" ? a._id.toString() : a[key];
      const right = key === "_id" ? b._id.toString() : b[key];
      if (left === right) continue;
      return (left > right ? 1 : -1) * (sort[key] < 0 ? -1 : 1);
    }
    return 0;
  });
}

function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === "_id") return row._id.toString() === value;
    return row[key] === value;
  });
}

const model = {
  find: (filter = {}) => {
    queries.push(filter);
    return chainable(rows.filter((row) => matches(row, filter)));
  },
  findByIdAndUpdate: (id, update) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const row = rows.find((item) => item._id.toString() === id);
    if (!row) return chainable(null);
    Object.assign(row, structuredClone(update.$set));
    return chainable(structuredClone(row));
  },
  deleteOne: async (filter) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const before = rows.length;
    rows = rows.filter((row) => !matches(row, filter));
    return { deletedCount: before - rows.length };
  },
  bulkWrite: async (operations) => {
    if (databaseFails) throw new Error("Simulated write failure");
    for (const operation of operations) {
      const row = rows.find((item) => item._id.toString() === operation.updateOne.filter._id);
      row.sortOrder = operation.updateOne.update.$set.sortOrder;
    }
    return { matchedCount: operations.length };
  },
  create: async (values) => {
    if (databaseFails) throw new Error("Simulated write failure");
    const row = {
      _id: hex(rows.length + 1),
      ...structuredClone(values),
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    };
    rows.push(row);
    return { toObject: () => structuredClone(row) };
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/lib/admin-session") {
    return { getAdminSession: async () => session };
  }
  if (request === "@/lib/db") return { connectDB: async () => {} };
  if (request === "@/models/faq") return { FaqModel: model };
  return originalLoad.call(this, request, parent, isMain);
};

const {
  getPublicFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
} = require("../src/services/faq.ts");
const createRoute = require("../src/app/api/faq/route.ts");
const idRoute = require("../src/app/api/faq/[id]/route.ts");
const orderRoute = require("../src/app/api/faq/order/route.ts");

const post = (url, body) => new Request(url + "", {
  method: "POST",
  headers: { "content-type": "application/json", origin: ORIGIN },
  body: JSON.stringify(body),
});
const patch = (id, body) => new Request(`${ORIGIN}/api/faq/${id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json", origin: ORIGIN },
  body: JSON.stringify(body),
});
const del = (id) => new Request(`${ORIGIN}/api/faq/${id}`, {
  method: "DELETE",
  headers: { origin: ORIGIN },
});
const putOrder = (body) => new Request(`${ORIGIN}/api/faq/order`, {
  method: "PUT",
  headers: { "content-type": "application/json", origin: ORIGIN },
  body: JSON.stringify(body),
});

const question = (n) => `Question ${n}?`;
const answer = (n) => `Answer ${n}.`;

function seedFaqs(count) {
  rows = Array.from({ length: count }, (_, index) => ({
    _id: hex(index + 1),
    question: question(index + 1),
    answer: answer(index + 1),
    sortOrder: index,
    isActive: index % 3 !== 2,
    createdAt: new Date(`2026-01-0${(index % 9) + 1}T00:00:00Z`),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
  }));
}

beforeEach(() => {
  databaseFails = false;
  session = { userId: "admin-1" };
  queries = [];
  seedFaqs(3);
});

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

test("the public list returns active questions only, with no admin fields", async () => {
  const publicFaqs = await getPublicFaqs();
  assert.deepEqual(queries.at(-1), { isActive: true });
  assert.equal(publicFaqs.length, 2, "the third seeded question is inactive");
  for (const faq of publicFaqs) {
    assert.deepEqual(Object.keys(faq).sort(), ["answer", "id", "question"]);
  }
});

test("an empty collection is an empty list, not an error", async () => {
  rows = [];
  assert.deepEqual(await getPublicFaqs(), []);
});

test("the admin list includes hidden questions and their bookkeeping fields", async () => {
  const adminFaqs = await getAdminFaqs();
  assert.equal(adminFaqs.length, 3);
  assert.equal(adminFaqs.some((faq) => !faq.isActive), true);
  for (const faq of adminFaqs) {
    assert.deepEqual(Object.keys(faq).sort(), [
      "answer", "createdAt", "id", "isActive", "question", "sortOrder", "updatedAt",
    ]);
  }
});

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

test("create, update and delete round-trip through the service", async () => {
  const created = await createFaq({
    question: "New question?", answer: "New answer.", sortOrder: 9, isActive: true,
  });
  assert.equal(rows.length, 4);

  const updated = await updateFaq(created.id, { isActive: false });
  assert.equal(updated.isActive, false);
  assert.equal(rows.find((row) => row._id.toString() === created.id).isActive, false);

  assert.equal(await deleteFaq(created.id), true);
  assert.equal(rows.length, 3);
  assert.equal(await deleteFaq(created.id), false, "deleting twice reports nothing removed");
});

test("updating a removed question returns null rather than inventing one", async () => {
  assert.equal(await updateFaq(hex(99), { question: "Gone?" }), null);
});

/* -------------------------------------------------------------------------- */
/*  Reordering                                                                */
/* -------------------------------------------------------------------------- */

test("a reorder renumbers the whole list in the order submitted", async () => {
  const reversed = [...rows].reverse().map((row) => row._id.toString());
  const result = await reorderFaqs(reversed);

  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((faq) => faq.sortOrder),
    [0, 1, 2],
  );
  assert.equal(result[0].id, hex(3), "the last seeded question is now first");
});

test("a reorder missing an id is refused, so a stale tab cannot drop a question", async () => {
  const partial = rows.slice(0, 2).map((row) => row._id.toString());
  assert.equal(await reorderFaqs(partial), null);
});

test("a reorder naming an id that no longer exists is refused", async () => {
  const ids = rows.map((row) => row._id.toString());
  ids.push(hex(99));
  assert.equal(await reorderFaqs(ids), null);
});

/* -------------------------------------------------------------------------- */
/*  Routes                                                                    */
/* -------------------------------------------------------------------------- */

test("POST creates a question and reports 201", async () => {
  const response = await createRoute.POST(
    post(ORIGIN, { question: "Route question?", answer: "Route answer.", sortOrder: 4, isActive: true }),
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.faq.question, "Route question?");
  assert.equal(rows.length, 4);
});

test("POST rejects a blank question with a readable message", async () => {
  const response = await createRoute.POST(
    post(ORIGIN, { question: "  ", answer: "x", sortOrder: 0, isActive: true }),
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /question/i);
});

test("every write is refused without an admin session", async () => {
  session = null;
  const context = { params: Promise.resolve({ id: hex(1) }) };

  assert.equal((await createRoute.POST(post(ORIGIN, {
    question: "q", answer: "a", sortOrder: 0, isActive: true,
  }))).status, 401);
  assert.equal((await idRoute.PATCH(patch(hex(1), { question: "q" }), context)).status, 401);
  assert.equal((await idRoute.DELETE(del(hex(1)), context)).status, 401);
  assert.equal((await orderRoute.PUT(putOrder({ ids: [hex(1)] }))).status, 401);
});

test("a write from a foreign origin is refused", async () => {
  const response = await createRoute.POST(new Request(ORIGIN, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ question: "q", answer: "a", sortOrder: 0, isActive: true }),
  }));
  assert.equal(response.status, 403);
});

test("PATCH and DELETE reject a non-ObjectId before touching the database", async () => {
  const context = { params: Promise.resolve({ id: "not-an-id" }) };
  assert.equal((await idRoute.PATCH(patch("not-an-id", { question: "q" }), context)).status, 400);
  assert.equal((await idRoute.DELETE(del("not-an-id"), context)).status, 400);
});

test("PATCH saves one field and leaves the rest alone", async () => {
  const response = await idRoute.PATCH(
    patch(hex(1), { isActive: false }),
    { params: Promise.resolve({ id: hex(1) }) },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.faq.isActive, false);
  assert.equal(body.faq.question, question(1));
  assert.equal(body.faq.answer, answer(1));
});

test("PATCH reports 404 for a question that is gone", async () => {
  const response = await idRoute.PATCH(
    patch(hex(99), { question: "q" }),
    { params: Promise.resolve({ id: hex(99) }) },
  );
  assert.equal(response.status, 404);
});

test("DELETE removes the question and reports 404 the second time", async () => {
  const context = { params: Promise.resolve({ id: hex(2) }) };
  assert.equal((await idRoute.DELETE(del(hex(2)), context)).status, 200);
  assert.equal(rows.length, 2);
  assert.equal((await idRoute.DELETE(del(hex(2)), context)).status, 404);
});

test("a database failure becomes a 500 with a readable message, not a stack trace", async () => {
  databaseFails = true;
  const response = await idRoute.PATCH(
    patch(hex(1), { question: "q" }),
    { params: Promise.resolve({ id: hex(1) }) },
  );
  assert.equal(response.status, 500);
  assert.match((await response.json()).message, /try again/i);
});

test("PUT order saves a valid list and refuses a stale one with 409", async () => {
  const ids = rows.map((row) => row._id.toString());

  const ok = await orderRoute.PUT(putOrder({ ids }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).faqs.length, 3);

  const stale = await orderRoute.PUT(putOrder({ ids: [ids[0]] }));
  assert.equal(stale.status, 409);
  assert.match((await stale.json()).message, /reload/i);
});
