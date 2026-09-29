/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/contact-card.test.cjs.
// No DOM, no timers, no network, no .env loading.
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  contactCardCreateSchema,
  contactCardMergedSchema,
  contactCardOrderSchema,
} = require("@/lib/validations/contact-card");
const {
  contactHoneypotSchema,
  contactMessageCreateSchema,
} = require("@/lib/validations/contact-message");
const { CONTACT_CARD_DEFAULTS } = require("@/lib/contact-card-defaults");
const { isContactCardIconKey } = require("@/lib/contact-card-icons");

const valid = {
  type: "office",
  label: "Office",
  description: "Asha Plaza, Savar, Dhaka",
  values: [{ text: "+880 1972-438732", href: "tel:+8801972438732" }],
  action: { label: "Get directions", href: "https://maps.google.com" },
  iconKey: "mapPin",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=x",
  sortOrder: 2,
  isActive: true,
};

/* -- the seeded cards are what the live page shows ------------------------ */

test("the seeded cards match the live Contact page", () => {
  assert.deepEqual(
    CONTACT_CARD_DEFAULTS.map((card) => card.label),
    ["Email", "Phone", "Office"],
  );
  assert.equal(CONTACT_CARD_DEFAULTS[0].values.length, 4, "four mailboxes");
  assert.equal(CONTACT_CARD_DEFAULTS[1].values.length, 2, "two numbers");
  assert.equal(CONTACT_CARD_DEFAULTS[2].action.label, "Get directions");
});

test("every seeded card passes the create schema", () => {
  for (const card of CONTACT_CARD_DEFAULTS) {
    const r = contactCardCreateSchema.safeParse(card);
    assert.equal(r.success, true, `${card.label}: ${r.error?.issues[0]?.message}`);
  }
});

test("the seeded tel: links contain no spaces, unlike the live page's", () => {
  const hrefs = CONTACT_CARD_DEFAULTS.flatMap((c) => c.values.map((v) => v.href));
  for (const href of hrefs) {
    assert.equal(/\s/.test(href), false, `${href} has whitespace`);
  }
});

/* -- a card must have something to show ----------------------------------- */

test("accepts a complete card", () => {
  const r = contactCardCreateSchema.safeParse(valid);
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("rejects a card with no description, values or action", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    description: "",
    values: [],
    action: null,
  });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /description, a value or an action/);
});

test("a description alone is enough, as on the live Office card", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    values: [],
    action: null,
  });
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("the merged schema re-checks a card that has been emptied", () => {
  const r = contactCardMergedSchema.safeParse({
    ...valid,
    description: "  ",
    values: [],
    action: null,
  });
  assert.equal(r.success, false);
});

/* -- links become hrefs, so the scheme is restricted ----------------------- */

test("accepts http, https, mailto and tel links", () => {
  for (const href of [
    "https://maps.google.com",
    "http://maps.google.com",
    "mailto:info@alliancebdltd.com",
    "tel:+8801972438732",
  ]) {
    const r = contactCardCreateSchema.safeParse({
      ...valid,
      values: [{ text: "x", href }],
    });
    assert.equal(r.success, true, href);
  }
});

test("rejects a javascript: href, which would be served to every visitor", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    values: [{ text: "click me", href: "javascript:alert(1)" }],
  });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /https:\/\/, mailto: or tel:/);
});

test("rejects a javascript: action link too", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    action: { label: "Get directions", href: "javascript:alert(1)" },
  });
  assert.equal(r.success, false);
});

test("rejects an http map embed, which would be blocked as mixed content", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    mapEmbedUrl: "http://www.google.com/maps/embed?pb=x",
  });
  assert.equal(r.success, false);
});

test("an unlinked value is stored with a null href, not an empty string", () => {
  const r = contactCardCreateSchema.safeParse({
    ...valid,
    values: [{ text: "Asha Plaza", href: "" }],
  });
  assert.equal(r.success, true, r.error?.issues[0]?.message);
  assert.equal(r.data.values[0].href, null);
});

/* -- enums are closed, so a typo cannot reach the page --------------------- */

test("rejects an unknown type, icon or extra field", () => {
  assert.equal(
    contactCardCreateSchema.safeParse({ ...valid, type: "fax" }).success,
    false,
  );
  assert.equal(
    contactCardCreateSchema.safeParse({ ...valid, iconKey: "pigeon" }).success,
    false,
  );
  assert.equal(
    contactCardCreateSchema.safeParse({ ...valid, colour: "red" }).success,
    false,
  );
});

test("an unrecognised icon key is rejected on write but tolerated on read", () => {
  assert.equal(isContactCardIconKey("mapPin"), true);
  assert.equal(isContactCardIconKey("totallyUnknownIcon"), false);
  assert.equal(isContactCardIconKey(null), false);
  assert.equal(isContactCardIconKey(undefined), false);
});

test("reordering refuses a duplicated or empty id list", () => {
  const id = "a".repeat(24);
  assert.equal(contactCardOrderSchema.safeParse({ ids: [id, id] }).success, false);
  assert.equal(contactCardOrderSchema.safeParse({ ids: [] }).success, false);
  assert.equal(contactCardOrderSchema.safeParse({ ids: ["nope"] }).success, false);
  assert.equal(contactCardOrderSchema.safeParse({ ids: [id] }).success, true);
});

/* -- the message form ------------------------------------------------------ */

test("accepts a complete message", () => {
  const r = contactMessageCreateSchema.safeParse({
    name: "Test Buyer",
    email: "buyer@example.com",
    subject: "Quotation",
    message: "Please quote 5000 t-shirts.",
  });
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("rejects a malformed address and a too-short message", () => {
  const base = {
    name: "Test Buyer",
    email: "buyer@example.com",
    subject: "Quotation",
    message: "Please quote 5000 t-shirts.",
  };
  assert.equal(
    contactMessageCreateSchema.safeParse({ ...base, email: "not-an-email" }).success,
    false,
  );
  assert.equal(
    contactMessageCreateSchema.safeParse({ ...base, message: "hi" }).success,
    false,
  );
});

test("the honeypot is read on its own, ignoring every other field", () => {
  const r = contactHoneypotSchema.safeParse({ website: "http://spam", junk: 1 });
  assert.equal(r.success, true);
  assert.equal(r.data.website, "http://spam");
});
