# Global Partners FAQ

## What was built

`/global-partners` is a page of static sections with one database-driven band:

| Section | Source | Database |
| --- | --- | --- |
| Hero and statistics | `lib/global-partners-sections` | No |
| Client logo wall and region filter | `lib/global-partners-sections` | No |
| Five partnership strengths | `lib/global-partners-sections` | No |
| FAQ band | `services/faq` | Yes |
| Closing call to action | `lib/global-partners-sections` | No |

The page reproduces the live page at
`https://alliancebdltd.com/global-partners`. The ten client logos are the files
already in `public/icons/logos`; nothing was added to `public/`.

The closing band is shared with `/buying-house` through
`components/sections/image-cta-section`, because both pages are the same
reference component with different copy. Each page keeps a thin wrapper that
supplies its own heading, description and `mailto` address, the latter read from
the admin-managed contact settings.

## Data model

One collection, `faqs`:

| Field | Type | Notes |
| --- | --- | --- |
| `question` | String | Required, trimmed, max 300 characters |
| `answer` | String | Required, trimmed, max 2000 characters |
| `sortOrder` | Number | Required, `0`–`9999`, the published position |
| `isActive` | Boolean | Required, defaults to `true` |
| `createdAt` | Date | Managed by `timestamps` |
| `updatedAt` | Date | Managed by `timestamps` |

Index: `{ isActive: 1, sortOrder: 1, createdAt: 1, _id: 1 }` — it serves the
public list, which filters on `isActive` and sorts by `sortOrder`, and gives the
admin list a total order without a sort stage.

There is no `page` scope field. A FAQ was considered for more than one page, but
nothing else on the site uses one yet, so a scope would be a field no query
filters on. If a second page later needs its own questions, add `page` to the
schema and to `FAQ_SORT` before adding rows to it.

## Migrations and seeders

No SQL migrations: the Mongoose indexes plus an idempotent seed script are the
equivalents, matching the rest of the project.

```bash
npm run init:faqs
```

The eight seeded entries are the questions and answers the live page already
shows, in `lib/faq-defaults`. They are matched on `question`, so the script only
ever inserts, never updates — an admin edit survives a re-run. It reports
`Added 0 missing FAQ entries` on a second run.

## Reading the band

`PartnerFaqSection` is a Server Component and calls `getPublicFaqs()` directly; a
Server Component never calls our own API. The site layout is already
`force-dynamic`, so a saved question is on the page on the next request and never
baked into a build.

If no question is active, `getPublicFaqs` returns `[]` and the section returns
`null` — the heading goes with it, so the page never shows an empty band.

## The accordion

The live page uses a Radix accordion inside a shadcn component. This project
ships no accordion dependency, so `components/common/faq-accordion` implements
the same behaviour directly: at most one panel open, and pressing the open
trigger closes it.

The panel animates with the `grid-template-rows` `0fr` → `1fr` transition instead
of a height keyframe, so it needs no extra CSS and respects
`prefers-reduced-motion` through `motion-reduce:`. Because the panel collapses
rather than unmounts, every answer is present in the server-rendered HTML — which
is why they can also be published as `FAQPage` structured data, something the
live page does not do.

## Request flow: editing a question

Every write authorizes independently through `rejectUnauthorizedAdminWrite`: an
admin session plus an exact match against the application origin.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/faq` | `POST` | Create a question |
| `/api/faq/[id]` | `PATCH` | Save one or more fields |
| `/api/faq/[id]` | `DELETE` | Delete a question |
| `/api/faq/order` | `PUT` | Save a new display order |

The reorder route takes every id at once. The service compares the submitted ids
against the ids that exist right now and returns `null` — a `409` telling the
editor to reload — if they differ. Without that check a stale tab could submit a
list missing an entry created elsewhere and silently renumber around it.

The admin screen filters and pages in the browser. The whole list is eight rows
today, and searching the rows already in memory keeps typing instant with no
round trip.

## Tests

```bash
npm run test:faq
```

43 tests in three files:

- `faq-schema.test.cjs` — the validation schemas, the id pattern, and the
  invariants the seed data has to hold (unique questions, a dense `0..n-1` order,
  every entry publishable).
- `faq-route.test.cjs` — the service and all three routes against a stubbed
  Mongoose model: the public read filters on `isActive` and leaks no admin
  fields, reordering refuses a stale list, and every route rejects a bad id, a
  foreign origin and a missing session before touching the database.
- `faq-render.test.cjs` — the server-rendered markup of all five sections: the
  hero copy and statistics, every partner logo and region filter, the five
  strengths, one `mailto` built from the contact settings, the accordion's
  `aria-expanded` / `aria-controls` wiring, the empty-band case, and the
  `FAQPage` structured data.
