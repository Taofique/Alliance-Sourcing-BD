/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/faq-render.test.cjs.
// Server-render only: no DOM, no timers, no network, no .env loading.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

let publicFaqs = [];

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/services/faq") {
    return { getPublicFaqs: async () => publicFaqs };
  }
  if (request === "@/services/site-settings") {
    return {
      getPublicSiteSettings: async () => ({
        footer: { emails: ["info@alliancebdltd.com", "mansur@alliancebdltd.com"] },
      }),
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");

const FaqAccordion = require("../src/components/common/faq-accordion.tsx").default;
const PartnerFaqSection = require("../src/components/sections/partner-faq-section.tsx").default;
const GlobalPartnersHero = require("../src/components/sections/global-partners-hero.tsx").default;
const PartnerCatalog = require("../src/components/sections/partner-catalog-section.tsx").default;
const PartnershipStrengths = require("../src/components/sections/partnership-strengths-section.tsx").default;
const GlobalPartnersCtaSection = require("../src/components/sections/global-partners-cta-section.tsx").default;
const { globalPartnersContent, partnershipStrengths } = require("../src/lib/global-partners-sections.ts");
const { adminNavigation } = require("../src/lib/admin-navigation.ts");

function render(element) {
  return renderToStaticMarkup(
    React.createElement(ImageConfigContext.Provider, { value: imageConfigDefault }, element),
  );
}

const faq = (n, overrides = {}) => ({
  id: String(n).padStart(24, "0"),
  question: "Question " + n + "?",
  answer: "Answer " + n + ".",
  ...overrides,
});

/* -------------------------------------------------------------------------- */
/*  The FAQ band                                                              */
/* -------------------------------------------------------------------------- */

test("no active questions renders no section at all, heading included", async () => {
  publicFaqs = [];
  assert.equal(await PartnerFaqSection(), null);
});

test("the band renders the live copy and one entry per question", async () => {
  publicFaqs = [faq(1), faq(2), faq(3)];
  const html = render(await PartnerFaqSection());

  assert.match(html, /Frequently Asked Questions/);
  assert.match(html, /Everything you need to know about partnering with Alliance Sourcing BD/);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 3);
});

test("every panel starts closed, so answers are not in the server markup", async () => {
  publicFaqs = [faq(1), faq(2)];
  const html = render(await PartnerFaqSection());

  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 0);
  assert.equal((html.match(/grid-rows-\[0fr\]/g) ?? []).length, 2);
});

test("every answer is present in the markup, not fetched on click", async () => {
  publicFaqs = [faq(1, { answer: "MOQ is 500 to 1000 pieces." })];
  const html = render(await PartnerFaqSection());
  assert.match(html, /MOQ is 500 to 1000 pieces\./);
});

test("the accordion wires each trigger to its own panel for assistive tech", () => {
  const html = render(React.createElement(FaqAccordion, { faqs: [faq(1), faq(2)] }));
  const triggers = html.match(/aria-controls="[^"]+"/g) ?? [];
  const panels = html.match(/id="[^"]+" role="region"/g) ?? [];
  assert.equal(triggers.length, 2);
  assert.equal(panels.length, 2);
  assert.match(html, /aria-labelledby="[^"]+"/);
});

test("each question is a heading, so the page keeps its h1 > h2 > h3 order", () => {
  const html = render(React.createElement(FaqAccordion, { faqs: [faq(1)] }));
  assert.match(html, /<h3[^>]*><button/);
});

test("published questions are marked up as FAQPage structured data", async () => {
  publicFaqs = [faq(1, { question: "What is your MOQ?", answer: "500 to 1000 pieces." })];
  const html = render(await PartnerFaqSection());

  const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(match, "no FAQPage JSON-LD in the output");

  const data = JSON.parse(match[1]);
  assert.equal(data["@type"], "FAQPage");
  assert.equal(data.mainEntity.length, 1);
  assert.equal(data.mainEntity[0].name, "What is your MOQ?");
  assert.equal(data.mainEntity[0].acceptedAnswer.text, "500 to 1000 pieces.");
});

test("the structured data tracks the questions that are actually published", async () => {
  publicFaqs = [faq(1), faq(2), faq(3)];
  const html = render(await PartnerFaqSection());
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data.mainEntity.length, 3);
  assert.deepEqual(data.mainEntity.map((entry) => entry.name), [faq(1).question, faq(2).question, faq(3).question]);
});

/* -------------------------------------------------------------------------- */
/*  The static page sections                                                  */
/* -------------------------------------------------------------------------- */

test("the hero carries the heading, tagline and all three statistics", () => {
  const html = render(React.createElement(GlobalPartnersHero));
  assert.match(html, /<h1[^>]*>Our Global Partners<\/h1>/);
  assert.match(html, /built on a decade of transparency and quality\./);
  for (const stat of globalPartnersContent.hero.stats) {
    assert.ok(html.includes(stat.value), stat.value);
    assert.ok(html.includes(stat.label), stat.label);
  }
  assert.match(html, /globalNetwork\.png/);
  assert.match(html, /aria-current="page">Global Partners/);
});

test("statistics are a term and value pair, not three loose headings", () => {
  const html = render(React.createElement(GlobalPartnersHero));
  assert.equal((html.match(/<dt/g) ?? []).length, 3);
  assert.equal((html.match(/<dd/g) ?? []).length, 3);
});

test("the catalogue lists every partner logo and every region filter", () => {
  const html = render(React.createElement(PartnerCatalog));
  for (const client of globalPartnersContent.partners.clients) {
    assert.ok(html.includes(client.name), client.name);
  }
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(html, /aria-pressed="false"/);
});

test("All Clients is the filter that starts selected, so no partner is hidden", () => {
  const html = render(React.createElement(PartnerCatalog));
  assert.match(html, /aria-pressed="true"[^>]*>All Clients</);
});

test("the strengths band renders all five titles and their descriptions", () => {
  const html = render(React.createElement(PartnershipStrengths));
  assert.match(html, /What Makes Our Partnerships Strong/);
  assert.match(html, /We build partnerships on trust, transparency, and shared success\./);
  for (const item of partnershipStrengths) {
    assert.match(html, new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(item.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal((html.match(/<h3/g) ?? []).length, 5);
});

test("the closing band offers one mailto built from the contact settings", async () => {
  const html = render(await GlobalPartnersCtaSection());
  assert.match(html, /Become Our Partner/);
  assert.match(html, /Scaling your supply chain starts with the right alliance\./);
  assert.match(html, /mailto:info@alliancebdltd\.com,mansur@alliancebdltd\.com/);
  assert.equal((html.match(/mailto:/g) ?? []).length, 1);
});

/* -------------------------------------------------------------------------- */
/*  Admin navigation                                                          */
/* -------------------------------------------------------------------------- */

test("the FAQ editor is reachable from the admin sidebar", () => {
  const links = adminNavigation.flatMap((group) => group.children ?? []);
  const faqLink = links.find((link) => link.href === "/admin/faqs");
  assert.ok(faqLink, "no /admin/faqs link in the admin navigation");
  assert.ok(faqLink.label.length > 0 && faqLink.description.length > 0);
  assert.ok(faqLink.icon, "the link needs an icon");
});
