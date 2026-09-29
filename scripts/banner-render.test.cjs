/* eslint-disable @typescript-eslint/no-require-imports */
// Run with node --require tsx/cjs --test scripts/banner-render.test.cjs.
// Server-render only: no DOM, no timers, no network, no .env loading.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// The Cloudinary cloud name must exist before next.config is evaluated.
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};

const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const config = require("../next.config.ts").default;

const BannerCarousel = require("../src/components/sections/banner-carousel.tsx").default;
const { SidebarNav } = require("../src/components/admin/admin-shell.tsx");
const {
  adminNavigation,
  isAdminLinkActive,
  getAdminSection,
} = require("../src/lib/admin-navigation.ts");

const imageConfig = { ...imageConfigDefault, ...config.images };

function render(element) {
  return renderToStaticMarkup(
    React.createElement(ImageConfigContext.Provider, { value: imageConfig }, element),
  );
}

const imageUrl = "https://res.cloudinary.com/test-cloud/image/upload/v1/a.png";

function slide(id, overrides = {}) {
  return {
    id,
    title: "Slide " + id,
    description: "Description " + id,
    imageUrl,
    imageAlt: "Alt text " + id,
    cta: { text: "Learn more", href: "/about" },
    ...overrides,
  };
}

const count = (html, pattern) => (html.match(pattern) ?? []).length;

test("zero slides render a plain heading and no carousel controls", () => {
  const html = render(React.createElement(BannerCarousel, { slides: [] }));
  assert.equal(count(html, /<h1/g), 1);
  assert.equal(html.includes("Alliance Sourcing BD"), true);
  assert.equal(html.includes("Previous banner"), false);
  assert.equal(html.includes("Next banner"), false);
  assert.equal(html.includes("banner rotation"), false);
  assert.equal(html.includes("aria-roledescription=\"carousel\""), false);
});

test("one slide renders a single h1 with no autoplay controls", () => {
  const html = render(React.createElement(BannerCarousel, { slides: [slide("a")] }));
  assert.equal(count(html, /<h1/g), 1);
  assert.equal(html.includes("Slide a"), true);
  assert.equal(count(html, /aria-roledescription="slide"/g), 1);
  assert.equal(html.includes("Previous banner"), false);
  assert.equal(html.includes("Next banner"), false);
  assert.equal(html.includes("banner rotation"), false);
  assert.equal(html.includes("Show banner 1"), false);
});

test("multiple slides expose one h1 and keep inactive slides out of reach", () => {
  const html = render(
    React.createElement(BannerCarousel, {
      slides: [slide("a"), slide("b"), slide("c")],
    }),
  );

  assert.equal(count(html, /<h1/g), 1);
  assert.equal(html.includes("Slide a"), true);
  // Inactive headings are present for the fade but not as headings.
  assert.equal(count(html, /<p aria-hidden="true"[^>]*>Slide /g), 2);
  // Non-current slides are inert and pointer-transparent.
  assert.equal(count(html, /inert=""/g), 2);
  assert.equal(count(html, /pointer-events-none/g), 2);
  // Only the current slide is stacked above the others.
  assert.equal(count(html, /z-10 opacity-100/g), 1);
});

test("controls are always rendered, not gated behind hover", () => {
  const html = render(
    React.createElement(BannerCarousel, { slides: [slide("a"), slide("b")] }),
  );
  assert.equal(html.includes("Previous banner"), true);
  assert.equal(html.includes("Next banner"), true);
  assert.equal(html.includes("Pause banner rotation"), true);
  assert.equal(html.includes("aria-pressed=\"false\""), true);
  assert.equal(html.includes("group-hover:opacity-100"), false);
});

test("dot indicators are bottom centred with an elongated active dot", () => {
  const html = render(
    React.createElement(BannerCarousel, {
      slides: [slide("a"), slide("b"), slide("c")],
    }),
  );
  assert.equal(count(html, /Show banner \d/g), 3);
  assert.equal(count(html, /Show banner 1: Slide a/g), 1);
  assert.equal(count(html, /w-8 bg-white/g), 1);
  assert.equal(count(html, /w-2 bg-white\/50/g), 2);
  assert.equal(count(html, /aria-current="true"/g), 1);
  assert.equal(html.includes("absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2"), true);
});

test("design tokens match the reference breakpoints and typography", () => {
  const html = render(
    React.createElement(BannerCarousel, { slides: [slide("a"), slide("b")] }),
  );
  assert.equal(html.includes("h-125 w-full overflow-hidden"), true);
  assert.equal(html.includes("md:h-150"), true);
  assert.equal(html.includes("xl:h-[calc(100vh-60px)]"), true);
  assert.equal(html.includes("bg-black/40 backdrop-blur-[2px]"), true);
  assert.equal(html.includes("object-cover"), true);
  assert.equal(html.includes("pt-12 md:pt-26 min-[1920px]:justify-center"), true);
  assert.equal(html.includes("max-w-7xl"), true);
  assert.equal(html.includes("max-w-5xl"), true);
  assert.equal(html.includes("text-2xl font-bold text-white md:text-5xl 2xl:text-6xl"), true);
  assert.equal(html.includes("text-sm text-white/90 2xl:text-xl"), true);
  assert.equal(html.includes("duration-1000 motion-reduce:transition-none"), true);
  assert.equal(html.includes("speak-link"), true);
  // Typography comes from the theme tokens in globals.css, not inline styles.
  assert.equal(count(html, /font-heading/g), 2);
  assert.equal(html.includes("fontFamily"), false);
  assert.equal(html.includes("style={{"), false);
});

test("the first slide is the LCP image and the deprecated priority prop is not used", () => {
  const html = render(
    React.createElement(BannerCarousel, { slides: [slide("a"), slide("b"), slide("c")] }),
  );
  const images = html.match(/<img[^>]*>/g) ?? [];
  assert.equal(images.length, 3);
  assert.equal(images.filter((tag) => tag.includes('fetchPriority="high"')).length, 1);
  assert.equal(images.filter((tag) => tag.includes('loading="eager"')).length, 1);
  assert.equal(images[0].includes('fetchPriority="high"'), true);
  assert.equal(images[1].includes('loading="lazy"'), true);
  assert.equal(html.includes("priority="), false, "priority is deprecated in Next.js 16");
  assert.equal(count(html, /sizes="100vw"/g), 3);
});

test("reduced motion is respected in markup and each slide gets a unique id", () => {
  const html = render(
    React.createElement(BannerCarousel, { slides: [slide("a"), slide("b")] }),
  );
  assert.equal(count(html, /motion-reduce:transition-none/g), 2);
  // One rising heading plus one description per slide.
  assert.equal(count(html, /motion-reduce:animate-none/g), 3);
  const ids = [...html.matchAll(/id="([^"]*slide-\d)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
});

test("internal and external CTA destinations use the right element", () => {
  const internal = render(
    React.createElement(BannerCarousel, {
      slides: [slide("a", { cta: { text: "Go", href: "/about" } }), slide("b")],
    }),
  );
  assert.equal(internal.includes("href=\"/about\""), true);
  assert.equal(internal.includes("target=\"_blank\""), false);

  const external = render(
    React.createElement(BannerCarousel, {
      slides: [slide("a", { cta: { text: "Go", href: "https://example.test/x" } }), slide("b")],
    }),
  );
  assert.equal(external.includes("href=\"https://example.test/x\""), true);
  assert.equal(external.includes("rel=\"noopener noreferrer\""), true);

  const withoutCta = render(
    React.createElement(BannerCarousel, {
      slides: [slide("a", { cta: null }), slide("b", { cta: null })],
    }),
  );
  assert.equal(withoutCta.includes("speak-link"), false);
});

// ------------------------------------------------------------ admin sidebar
test("admin link matching is segment aware and Dashboard is only active at /admin", () => {
  assert.equal(isAdminLinkActive("/admin", "/admin"), true);
  assert.equal(isAdminLinkActive("/admin/banners", "/admin"), false);
  assert.equal(isAdminLinkActive("/admin/banners", "/admin/banners"), true);
  assert.equal(isAdminLinkActive("/admin/banners/extra", "/admin/banners"), true);
  assert.equal(isAdminLinkActive("/admin/banners-archive", "/admin/banners"), false);
  assert.equal(isAdminLinkActive("/admin/settings/contact", "/admin/settings/logos"), false);
  assert.equal(isAdminLinkActive(null, "/admin"), false);
});

test("section lookup names the group and child for the header", () => {
  assert.deepEqual(getAdminSection("/admin/banners"), {
    group: "Homepage",
    link: getAdminSection("/admin/banners").link,
  });
  assert.equal(getAdminSection("/admin/banners").link.label, "Banners");
  assert.equal(getAdminSection("/admin/settings/contact").link.label, "Contact details");
  assert.equal(getAdminSection("/admin").link, null);
  assert.equal(getAdminSection("/admin/unknown"), null);
});

test("sidebar marks the exact page with aria-current and expands the active group", () => {
  const html = render(React.createElement(SidebarNav, { pathname: "/admin/banners" }));
  assert.equal(count(html, /aria-current="page"/g), 1);
  assert.equal(
    /<a[^>]*aria-current="page"[^>]*href="\/admin\/banners"/.test(html),
    true,
  );
  assert.equal(/aria-controls="admin-group-homepage"/.test(html), true);
  assert.equal(/aria-expanded="true"/.test(html), true);
  assert.equal(
    /aria-controls="admin-group-site-settings"/.test(html) &&
      /id="admin-group-site-settings"[^>]*hidden/.test(html),
    true,
    "an unrelated group stays collapsed and hidden",
  );
  // Exactly one group is open, and every other collapsible group is shut.
  // Counted against the navigation itself so adding a group cannot silently
  // invalidate this check.
  const collapsible = adminNavigation.filter((group) => group.children).length;
  const expanded = count(html, /aria-expanded="true"/g);
  const collapsed = count(html, /aria-expanded="false"/g);
  assert.equal(expanded, 1, "only the active group is open");
  assert.equal(expanded + collapsed, collapsible, "every other group is collapsed");
  assert.equal(html.includes("Banners"), true);
});

test("sidebar renders only working editor links", () => {
  const html = render(React.createElement(SidebarNav, { pathname: "/admin" }));
  for (const href of ["/admin", "/admin/settings/contact", "/admin/settings/logos", "/admin/banners"]) {
    assert.equal(html.includes(`href="${href}"`), true, href);
  }
  for (const dead of ["/admin/products", "/admin/catalog", "/admin/services", "/admin/contact"]) {
    assert.equal(html.includes(dead), false, dead);
  }
});
