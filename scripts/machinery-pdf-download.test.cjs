/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/machinery-pdf-download.test.cjs.
// No DOM, no timers, no network. The service, the Cloudinary helper and global
// fetch are stubbed; only the download contract is under test.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");

const PDF = {
  url: "https://res.cloudinary.com/test-cloud/raw/upload/v1/alliance-sourcing-bd/documents/abc-123.pdf",
  publicId: "alliance-sourcing-bd/documents/abc-123.pdf",
  fileName: "Factory Profile.pdf",
};

const state = {};
function reset() {
  state.pdf = PDF;
  state.upstream = new Response("%PDF-1.4 body", {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": "14",
      "accept-ranges": "bytes",
      etag: '"abc"',
    },
  });
  state.throw = false;
  state.rangeSeen = undefined;
  globalThis.fetch = async (url, options) => {
    if (state.throw) throw new Error("network down");
    state.rangeSeen = options?.headers?.range;
    return state.upstream;
  };
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/services/machinery") {
    return { getFactoryPdf: async () => state.pdf };
  }
  if (request === "@/lib/cloudinary") {
    return {
      factoryPdfDeliveryUrl: (publicId) =>
        `https://res.cloudinary.com/test-cloud/raw/upload/s--sig/v1/${publicId.replace(/\.pdf$/i, "")}.pdf`,
    };
  }
  return originalLoad(request, parent, isMain);
};

globalThis.fetch = async (url, options) => {
  if (state.throw) throw new Error("network down");
  state.rangeSeen = options?.headers?.range;
  return state.upstream;
};

const { GET } = require("../src/app/api/machinery/factory-pdf/download/route.ts");
const { attachmentDisposition } = require("../src/lib/content-disposition.ts");

const request = (headers = {}) =>
  new Request("http://localhost:3000/api/machinery/factory-pdf/download", { headers });

/* ------------------------------- the helper -------------------------------- */

test("a plain file name is offered twice, so old and new browsers agree", () => {
  const value = attachmentDisposition("Factory Profile.pdf");
  assert.match(value, /^attachment; filename="Factory Profile\.pdf"/);
  assert.match(value, /filename\*=UTF-8''Factory%20Profile\.pdf/);
});

test("a stored name cannot break out of the header", () => {
  // The name is operator-supplied: a quote, a backslash or a newline must not
  // be able to end the field or add a header of its own.
  const value = attachmentDisposition('a";\r\nX-Injected: 1\r\n"b.pdf');
  // Nothing that could end a header line may survive anywhere in the value.
  assert.ok(!/[\r\n]/.test(value), "no CR or LF may reach the header");
  assert.ok(value.startsWith('attachment; filename="'), "one header, one field");
  // The quotes are defanged in the plain form and percent-encoded in the other,
  // so the text is still legible but can no longer act as syntax.
  assert.match(value, /filename="a_;__X-Injected: 1___b\.pdf"/);
  assert.match(value, /filename\*=UTF-8''a%22%3B%0D%0AX-Injected%3A%201%0D%0A%22b\.pdf/);
});

test("a non-ASCII name keeps its characters in the encoded form", () => {
  const value = attachmentDisposition("Ünïcode Prôfile.pdf");
  assert.match(value, /filename="_n_code Pr_file\.pdf"/);
  assert.match(value, /filename\*=UTF-8''%C3%9Cn%C3%AFcode%20Pr%C3%B4file\.pdf/);
});

test("parentheses are encoded, which encodeURIComponent leaves alone", () => {
  const value = attachmentDisposition("2026 brochure (final).pdf");
  assert.match(value, /filename="2026 brochure \(final\)\.pdf"/);
  assert.match(value, /filename\*=UTF-8''2026%20brochure%20%28final%29\.pdf/);
});

/* -------------------------------- the route -------------------------------- */

test("a download is served as an attachment under the stored name", async () => {
  reset();
  const res = await GET(request());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.match(res.headers.get("content-disposition"), /^attachment; filename="Factory Profile\.pdf"/);
  assert.equal(res.headers.get("content-length"), "14");
  assert.equal(res.headers.get("etag"), '"abc"');
  assert.equal(await res.text(), "%PDF-1.4 body");
});

test("the stored name is echoed even when the reference is odd", async () => {
  reset();
  state.pdf = { ...PDF, fileName: "  2026 brochure (final) v2.pdf  " };
  const res = await GET(request());
  assert.match(res.headers.get("content-disposition"), /filename="2026 brochure \(final\) v2\.pdf"/);
});

test("a range request is forwarded, so seeking does not refetch the file", async () => {
  reset();
  state.upstream = new Response("%PDF", {
    status: 206,
    headers: { "content-range": "bytes 0-3/7268440", "content-length": "5" },
  });
  const res = await GET(request({ range: "bytes=0-4" }));
  assert.equal(state.rangeSeen, "bytes=0-4");
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-range"), "bytes 0-3/7268440");
});

test("no document means 404, not an empty attachment", async () => {
  reset();
  state.pdf = null;
  const res = await GET(request());
  assert.equal(res.status, 404);
});

test("an upstream failure is a 502 and never a truncated file", async () => {
  reset();
  state.throw = true;
  const res = await GET(request());
  assert.equal(res.status, 502);
  assert.equal(res.headers.get("content-disposition"), null);
});

test("a rejected upstream response is not passed on as a PDF", async () => {
  reset();
  state.upstream = new Response("nope", { status: 401 });
  const res = await GET(request());
  assert.equal(res.status, 502);
  assert.equal(res.headers.get("content-type"), "application/json");
});

test("the upstream is asked with the signed url, not the stored one", async () => {
  reset();
  let seen = "";
  globalThis.fetch = async (url) => {
    seen = String(url);
    return state.upstream;
  };
  await GET(request());
  // The extension has to come off the id, or the format is added twice.
  assert.match(seen, /documents\/abc-123\.pdf$/);
  assert.ok(!seen.includes(".pdf.pdf"), "the format must not be doubled");
});
