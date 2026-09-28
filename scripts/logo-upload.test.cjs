/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/logo-upload.test.cjs.
// No .env loading, live database connections, or real Cloudinary requests.
const { test, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { Writable } = require("node:stream");
const sharp = require("sharp");

const initial = {
  key: "main",
  contact: { phones: [{ label: "+880123", href: "tel:+880123" }], topBarEmails: ["hello@example.test"] },
  logos: [
    { key: "apparels", title: "Alliance", subtitle: "Apparels", imageUrl: "/apparels.png", publicId: null },
    { key: "sourcing", title: "Alliance", subtitle: "Sourcing", imageUrl: "/sourcing.png", publicId: null },
  ],
};
let saved, session, cloudFails, databaseFails, disappear, uploadCount, lastOptions, lastPng;
const model = {
  exists: async (filter) => saved?.key === filter.key && saved.logos.some((logo) => logo.key === filter["logos.key"]) ? { _id: "test" } : null,
  updateOne: async (filter, update, options) => {
    assert.equal(options.runValidators, true);
    if (databaseFails) throw new Error("Simulated write failure");
    if (disappear) return { matchedCount: 0 };
    if (!saved || saved.key !== filter.key) return { matchedCount: 0 };
    if (update.$set.contact) {
      saved.contact = structuredClone(update.$set.contact);
      return { matchedCount: 1 };
    }
    assert.equal(options.upsert, false);
    assert.deepEqual(Object.keys(update.$set).sort(), ["logos.$.imageUrl", "logos.$.publicId"]);
    const logo = saved.logos.find((item) => item.key === filter["logos.key"]);
    if (!logo) return { matchedCount: 0 };
    logo.imageUrl = update.$set["logos.$.imageUrl"];
    logo.publicId = update.$set["logos.$.publicId"];
    return { matchedCount: 1 };
  },
  findOne: () => ({ lean: () => ({ exec: async () => structuredClone(saved) }) }),
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/lib/admin-session") return { getAdminSession: async () => session };
  if (request === "@/lib/db") return { connectDB: async () => {} };
  if (request === "@/models/site-settings") return { SiteSettings: model };
  return originalLoad.call(this, request, parent, isMain);
};
const cloudinary = require("cloudinary").v2;
const originalUpload = cloudinary.uploader.upload_stream;
cloudinary.uploader.upload_stream = (options, callback) => {
  uploadCount++;
  lastOptions = options;
  const chunks = [];
  return new Writable({
    write(chunk, encoding, done) { chunks.push(chunk); done(); },
    final(done) {
      lastPng = Buffer.concat(chunks);
      if (cloudFails) callback({ http_code: 503 });
      else callback(null, {
        secure_url: "https://res.cloudinary.com/test-cloud/image/upload/v1/" + options.public_id + ".png",
        public_id: options.folder + "/" + options.public_id,
      });
      done();
    },
  });
};
process.env.BETTER_AUTH_URL = "https://example.test";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-only";
process.env.CLOUDINARY_API_SECRET = "test-only";
const { normalizeLogo } = require("../src/lib/logo-image.ts");
const { MAX_LOGO_BYTES } = require("../src/lib/logo-upload-limits.ts");
const { readLogoFormData, MAX_LOGO_REQUEST_BYTES } = require("../src/lib/logo-form-data.ts");
const { POST } = require("../src/app/api/site-settings/logo/route.ts");
const { PATCH } = require("../src/app/api/site-settings/route.ts");
const { getPublicSiteSettings } = require("../src/services/site-settings.ts");
const { renderToStaticMarkup } = require("react-dom/server");
const React = require("react");
const Logo = require("../src/components/layout/logo.tsx").default;

beforeEach(() => {
  saved = structuredClone(initial);
  session = { user: { email: "admin@example.test" } };
  cloudFails = databaseFails = disappear = false;
  uploadCount = 0;
});
after(() => {
  Module._load = originalLoad;
  cloudinary.uploader.upload_stream = originalUpload;
});
const svg = (body) => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">' + body + "</svg>");
async function raster(format, width = 80, height = 40) {
  return sharp({ create: { width, height, channels: 4, background: { r: 30, g: 120, b: 200, alpha: 0.5 } } }).toFormat(format).toBuffer();
}
function request(buffer, key = "sourcing", origin = "https://example.test") {
  const form = new FormData();
  // Intentionally lie about MIME and extension: contents must drive validation.
  form.set("file", new File([buffer], "logo.txt", { type: "text/plain" }));
  form.set("logoKey", key);
  return new Request("https://example.test/api/site-settings/logo", { method: "POST", headers: { origin }, body: form });
}

for (const format of ["png", "jpeg", "webp", "avif"]) {
  test(format + " content uploads as PNG and changes only the selected logo", async () => {
    const fixture = await raster(format);
    if (format === "avif") {
      const metadata = await sharp(fixture).metadata();
      assert.equal(metadata.format, "heif");
      assert.equal(metadata.compression, "av1");
      console.log("Real AVIF fixture: Sharp reports heif / av1; libvips " + sharp.versions.vips);
    }
    const response = await POST(request(fixture));
    assert.equal(response.status, 200);
    assert.equal((await sharp(lastPng).metadata()).format, "png");
    assert.deepEqual(saved.contact, initial.contact);
    assert.deepEqual(saved.logos[0], initial.logos[0]);
    assert.equal(saved.logos[1].title, initial.logos[1].title);
    assert.equal(saved.logos[1].subtitle, initial.logos[1].subtitle);
    assert.notEqual(saved.logos[1].imageUrl, initial.logos[1].imageUrl);
    assert.equal(lastOptions.overwrite, false);
    assert.equal(lastOptions.folder, "alliance-sourcing-bd/logos");
  });
}
test("SVG transparency, gradients, inline styles and internal references survive PNG conversion", async () => {
  const response = await POST(request(svg('<defs><linearGradient id="gradient"><stop offset="0" stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient><rect id="shape" width="20" height="20"/></defs><use href="#shape" style="fill:url(#gradient);opacity:0.5"/>')));
  assert.equal(response.status, 200);
  const { data, info } = await sharp(lastPng).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  assert.equal(data[data.length - 1], 0);
  assert.ok(data[3] > 0 && data[3] < 255);
});
test("size, aspect ratio, no enlargement, and EXIF orientation", async () => {
  const resized = await sharp(await normalizeLogo(await raster("png", 1600, 800))).metadata();
  assert.equal(resized.width, 1024); assert.equal(resized.height, 512);
  const small = await sharp(await normalizeLogo(await raster("png"))).metadata();
  assert.equal(small.width, 80); assert.equal(small.height, 40);
  const rotated = await sharp(await raster("jpeg")).withMetadata({ orientation: 6 }).toBuffer();
  const result = await sharp(await normalizeLogo(rotated)).metadata();
  assert.equal(result.width, 40); assert.equal(result.height, 80);
});
const unsafe = [
  '<script>alert(1)</script>',
  '<rect width="10" height="10" onload="alert(1)"/>',
  '<foreignObject/>',
  '<image href="https://example.test/image.png"/>',
  '<use href="https://example.test/logo.svg#x"/>',
  '<rect style="fill:url(https://example.test/a)"/>',
  '<rect fill="url(&#104;ttps://example.test/a)"/>',
  '<rect style="fill:u\\72l(https://example.test/a)"/>',
  '<style>@import "https://example.test/style.css";</style>',
  '<rect xml:base="https://example.test/"/>',
  '<rect><g></rect>',
];
for (const markup of unsafe) {
  test("reject unsafe/malformed SVG: " + markup, async () => {
    const response = await POST(request(svg(markup)));
    assert.equal(response.status, 415);
    assert.equal(uploadCount, 0);
    assert.deepEqual(saved, initial);
  });
}
test("reject DTD/entities, corrupt images, unsupported GIF, excessive pixels and animation", async () => {
  const dtd = Buffer.from('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>');
  const pixels = Buffer.from([...Array(4).fill([255,0,0,255]).flat(), ...Array(4).fill([0,0,255,255]).flat()]);
  const animated = await sharp(pixels, { raw: { width: 2, height: 4, pageHeight: 2, channels: 4 } }).webp({ loop: 0, delay: [100,100] }).toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);
  for (const input of [dtd, Buffer.from("not an image"), (await raster("png")).subarray(0, 30), await raster("gif"), await raster("png", 4001, 4000), animated]) {
    await assert.rejects(normalizeLogo(input), { status: 415 });
  }
});
test("oversized file, oversized chunked body and dishonest Content-Length are rejected", async () => {
  assert.equal((await POST(request(Buffer.alloc(MAX_LOGO_BYTES + 1)))).status, 413);
  const body = new Uint8Array(MAX_LOGO_REQUEST_BYTES + 1);
  for (const headers of [{}, { "content-length": "5" }, { "content-length": String(body.length) }]) {
    const req = new Request("https://example.test", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x", ...headers }, body });
    await assert.rejects(readLogoFormData(req), { status: 413 });
  }
  assert.equal(uploadCount, 0);
});
test("invalid key and missing settings never upload or create data", async () => {
  const fixture = await raster("png");
  assert.equal((await POST(request(fixture, "unknown"))).status, 404);
  saved = null;
  assert.equal((await POST(request(fixture))).status, 404);
  assert.equal(saved, null); assert.equal(uploadCount, 0);
});
test("missing session and wrong/missing origin fail before reading data", async () => {
  session = null;
  assert.equal((await POST(request(Buffer.from("bad")))).status, 401);
  session = {};
  assert.equal((await POST(request(Buffer.from("bad"), "sourcing", "https://attacker.test"))).status, 403);
  const req = request(Buffer.from("bad")); req.headers.delete("origin");
  assert.equal((await POST(req)).status, 403);
  assert.equal(uploadCount, 0);
});
test("malformed multipart, duplicate fields, empty file and JSON are rejected", async () => {
  for (const form of [new FormData(), (() => { const f = new FormData(); f.set("file", new File([], "empty.png")); f.set("logoKey", "sourcing"); return f; })(), (() => { const f = new FormData(); f.set("file", new File(["x"], "x.png")); f.append("logoKey", "sourcing"); f.append("logoKey", "apparels"); return f; })()]) {
    await assert.rejects(readLogoFormData(new Request("https://example.test", { method: "POST", body: form })), { status: 400 });
  }
  await assert.rejects(readLogoFormData(new Request("https://example.test", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x" }, body: "broken" })), { status: 400 });
  await assert.rejects(readLogoFormData(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })), { status: 415 });
});
test("Cloudinary failure preserves the saved logo", async () => {
  cloudFails = true;
  assert.equal((await POST(request(await raster("png")))).status, 502);
  assert.deepEqual(saved, initial);
});
test("database failure reports retained asset and no destructive cleanup", async () => {
  databaseFails = true;
  const response = await POST(request(await raster("png")));
  assert.equal(response.status, 500);
  assert.match((await response.json()).message, /retained/);
  assert.equal(uploadCount, 1); assert.deepEqual(saved, initial);
});
test("record disappearing during upload returns conflict", async () => {
  disappear = true;
  assert.equal((await POST(request(await raster("png")))).status, 409);
  assert.deepEqual(saved, initial);
});
test("repeated replacements get unique Cloudinary identifiers", async () => {
  const fixture = await raster("png");
  await POST(request(fixture));
  const first = saved.logos[1].publicId;
  await POST(request(fixture));
  assert.notEqual(saved.logos[1].publicId, first);
});
test("existing contact editor endpoint and public logo rendering still work", async () => {
  const response = await PATCH(new Request("https://example.test/api/site-settings", {
    method: "PATCH", headers: { origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ phones: [{ label: "+880123456789" }, { label: "+880987654321" }], topBarEmails: ["one@example.test", "two@example.test"] }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(saved.logos, initial.logos);
  await POST(request(await raster("png")));
  const settings = await getPublicSiteSettings();
  const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
  const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
  const config = require("../next.config.ts").default;
  const html = renderToStaticMarkup(React.createElement(ImageConfigContext.Provider,
    { value: { ...imageConfigDefault, ...config.images } },
    React.createElement(Logo, { logos: settings.logos })));
  assert.ok(html.includes(encodeURIComponent(settings.logos[1].imageUrl)) || html.includes(settings.logos[1].imageUrl));
  assert.ok(html.includes("Sourcing"));
  assert.equal(settings.contact.topBarEmails[0], "one@example.test");
});
