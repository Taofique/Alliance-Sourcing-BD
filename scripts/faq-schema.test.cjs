/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/faq-schema.test.cjs.
// No DOM, no timers, no network, no .env loading.
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FAQ_ID_PATTERN,
  faqCreateSchema,
  faqUpdateSchema,
  faqOrderSchema,
} = require("@/lib/validations/faq");
const { initialFaqs } = require("@/lib/faq-defaults");

const valid = {
  question: "What is your minimum order quantity (MOQ)?",
  answer: "Typically it ranges from 500 to 1000 pieces per style.",
  sortOrder: 0,
  isActive: true,
};

test("accepts a complete question", () => {
  const r = faqCreateSchema.safeParse(valid);
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("trims surrounding whitespace so a padded field cannot look published", () => {
  const r = faqCreateSchema.safeParse({ ...valid, question: "  Padded?  " });
  assert.equal(r.success, true);
  assert.equal(r.data.question, "Padded?");
});

test("rejects a blank question", () => {
  assert.equal(faqCreateSchema.safeParse({ ...valid, question: "   " }).success, false);
});

test("rejects a blank answer", () => {
  assert.equal(faqCreateSchema.safeParse({ ...valid, answer: "" }).success, false);
});

test("rejects an unknown field rather than storing it", () => {
  const r = faqCreateSchema.safeParse({ ...valid, page: "global-partners" });
  assert.equal(r.success, false);
});

test("rejects a non-integer or out-of-range display order", () => {
  assert.equal(faqCreateSchema.safeParse({ ...valid, sortOrder: 1.5 }).success, false);
  assert.equal(faqCreateSchema.safeParse({ ...valid, sortOrder: -1 }).success, false);
  assert.equal(faqCreateSchema.safeParse({ ...valid, sortOrder: 10000 }).success, false);
});

test("an update needs at least one field, so a no-op never reports success", () => {
  assert.equal(faqUpdateSchema.safeParse({}).success, false);
  assert.equal(faqUpdateSchema.safeParse({ isActive: false }).success, true);
});

test("a reorder must list each id exactly once", () => {
  const id = "a".repeat(24);
  assert.equal(faqOrderSchema.safeParse({ ids: [id] }).success, true);
  assert.equal(faqOrderSchema.safeParse({ ids: [id, id] }).success, false);
  assert.equal(faqOrderSchema.safeParse({ ids: [] }).success, false);
});

test("the id pattern matches only 24-character hex ids", () => {
  assert.equal(FAQ_ID_PATTERN.test("a".repeat(24)), true);
  assert.equal(FAQ_ID_PATTERN.test("../etc/passwd"), false);
  assert.equal(FAQ_ID_PATTERN.test("a".repeat(23)), false);
});

test("the shipped questions are unique, ordered and published", () => {
  const questions = initialFaqs.map((faq) => faq.question);
  assert.equal(new Set(questions).size, questions.length, "duplicate question seeded");

  assert.deepEqual(
    initialFaqs.map((faq) => faq.sortOrder),
    initialFaqs.map((_, index) => index),
    "sortOrder must be a dense 0..n-1 sequence",
  );

  for (const faq of initialFaqs) {
    assert.equal(faq.isActive, true, "every seeded question must be published");
    assert.ok(faq.question.length > 0 && faq.answer.length > 0);
    assert.equal(faqCreateSchema.safeParse(faq).success, true, faq.question);
  }
});
