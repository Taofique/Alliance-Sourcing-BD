This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Factory & Machinery page

The `/factory-machinery` page is part static and part database-driven:

- **Static** (no database): the hero, the "Own Factory" copy, the "Advanced
  Machinery" cards and the closing call to action, with the bundled photographs.
- **Database**: the machinery inventory tables, and the factory profile PDF.

### One-time setup: seed the inventory

There are no SQL migrations in this project — the equivalents are the Mongoose
indexes plus an idempotent seed script. Run it once per environment:

```bash
npm run init:machinery
```

It creates the unique indexes on the category name and slug, and inserts the 4
categories and 25 machines (9 cutting, 8 sewing, 5 finishing, 3 embroidery — 293
units in total) if they are not already there.
Running it again is safe: it reports `Added 0 categories and 0 items` and leaves
anything an admin has edited alone.

### Editing the inventory

Sign in at `/admin/login`, then use the **Machinery** group in the sidebar:

| Page | What it edits |
| --- | --- |
| `/admin/machinery/categories` | Category names, slugs, display order. Deleting a category also deletes its machines, after a confirmation that counts them. |
| `/admin/machinery/items` | Every machine: name, brand, quantity, row number and category, with search, a category filter and paging. |
| `/admin/machinery/factory-pdf` | Uploads the factory profile PDF to Cloudinary (10 MB max) and publishes or removes it. |

Category totals and the grand total are summed from `quantity` every time the
inventory is read, so they can never drift from the rows above them, and a saved
change is on the public page immediately.

See [`docs/machinery-inventory.md`](docs/machinery-inventory.md) for the data
model and request flow.

## Global Partners page

`/global-partners` is part static and part database-driven:

- **Static** (no database): the hero and its three statistics, the client logo
  wall and its region filter, the five partnership strengths and the closing call
  to action. All of it is read from
  [`src/lib/global-partners-sections.ts`](src/lib/global-partners-sections.ts),
  and the ten client logos are the files already in `public/icons/logos`.
- **Database**: the FAQ band, and nothing else on the page.

The hero, catalogue, strengths and closing band are also the same components the
live page renders, so the page is a structural match rather than a lookalike. The
closing band is shared with `/buying-house` through
[`ImageCtaSection`](src/components/sections/image-cta-section.tsx).

### One-time setup: seed the questions

Like the rest of the project there are no SQL migrations — the Mongoose indexes
plus an idempotent seed script stand in for them. Run it once per environment:

```bash
npm run init:faqs
```

It creates the `{ isActive, sortOrder, createdAt, _id }` index and inserts the
eight questions the live page shows if they are not already there. Running it
again is safe: it reports `Added 0 missing FAQ entries` and never edits a
question an admin has already changed.

### Editing the questions

Sign in at `/admin/login`, then use **Pages → Global partners FAQs**:

| Page | What it edits |
| --- | --- |
| `/admin/faqs` | Every question and answer, its display order and whether it is published, with search and paging. |

A question can be hidden without being deleted — it keeps its place in the order
and simply stops appearing on the page. Deleting asks for confirmation and names
the question.

Two behaviours are worth knowing:

- If no question is active the whole FAQ band is omitted, heading included,
  rather than publishing an empty section.
- The published questions are also emitted as `FAQPage` structured data, so the
  page can earn rich results. The live page does not do this.

Reordering submits every id at once and the server refuses the write if the list
changed in another tab, so a stale browser cannot quietly drop a question.

### Tests

```bash
npm run test:faq
```

43 tests across three files: the validation schemas and the shipped seed data
(`faq-schema`), the service and the three API routes against a stubbed model
(`faq-route`), and the server-rendered markup of every section
(`faq-render`).

See [`docs/global-partners-faq.md`](docs/global-partners-faq.md) for the data
model, the seed script and the request flow.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
