/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/page-banner-schema.test.cjs.
// No DOM, no timers, no network, no .env loading.
const test = require("node:test");
const assert = require("node:assert/strict");
const { pageBannerUpdateSchema } = require("@/lib/validations/page-banner");

const CLOUD = "drdsszsms";
process.env.CLOUDINARY_CLOUD_NAME = CLOUD;

const ok = (publicId) => ({
  imageUrl: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${publicId}.png`,
  publicId,
});

const OWN = "alliance-sourcing-bd/page-banners/abcdefgh-1234-5678";

test("accepts a genuine page-banner upload", () => {
  const r = pageBannerUpdateSchema.safeParse({ image: ok(OWN) });
  assert.equal(r.success, true, r.error?.issues[0]?.message);
});

test("an omitted image is rejected, so a no-op can never report success", () => {
  assert.equal(pageBannerUpdateSchema.safeParse({}).success, false);
});

test("null clears the image", () => {
  assert.equal(pageBannerUpdateSchema.safeParse({ image: null }).success, true);
});

test("rejects a footer-cta publicId (cross-folder guard)", () => {
  const r = pageBannerUpdateSchema.safeParse({
    image: ok("alliance-sourcing-bd/footer-cta/abcdefgh-1234-5678"),
  });
  assert.equal(r.success, false);
});

test("rejects a homepage-banner publicId (cross-folder guard)", () => {
  const r = pageBannerUpdateSchema.safeParse({
    image: ok("alliance-sourcing-bd/banners/abcdefgh-1234-5678"),
  });
  assert.equal(r.success, false);
});

test("rejects a non-Cloudinary host", () => {
  const r = pageBannerUpdateSchema.safeParse({
    image: { imageUrl: "https://evil.example.com/x.png", publicId: OWN },
  });
  assert.equal(r.success, false);
});

test("rejects a url whose publicId does not match the path", () => {
  const r = pageBannerUpdateSchema.safeParse({
    image: {
      imageUrl: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/alliance-sourcing-bd/page-banners/00000000-9999.png`,
      publicId: OWN,
    },
  });
  assert.equal(r.success, false);
});

test("rejects http (not https)", () => {
  const r = pageBannerUpdateSchema.safeParse({
    image: {
      imageUrl: `http://res.cloudinary.com/${CLOUD}/image/upload/v1/${OWN}.png`,
      publicId: OWN,
    },
  });
  assert.equal(r.success, false);
});
