# Contact page

`/contact` is the live page rebuilt: the same cover heading, the same card grid,
the same message form beside a map, and the same closing band.

The rule that shapes everything here is that **no contact content is hardcoded in
the UI**. The cards come from the `contact_cards` collection, and the grid renders
however many it is given.

## Why the card shape is not `{ label, value }`

A single `value` string cannot express the live page. Its Email card lists four
mailboxes, its Phone card lists two numbers, and its Office card shows the address
as a grey supporting line with a "Get directions" link beneath it and no value
list at all. So a card is:

| Field | Purpose |
| --- | --- |
| `type` | `email`, `phone`, `office` or `hours`. A closed list, used by the admin for filtering and by the seed to recognise an existing card. |
| `label` | The card's heading, e.g. "Office". |
| `description` | The grey supporting line. May be empty. |
| `values` | Zero to eight linked lines, each `{ text, href }`. `href` is `null` when the value is shown but not clickable. |
| `action` | An optional `{ label, href }` — "Get directions". |
| `iconKey` | `mail`, `phone`, `mapPin` or `clock`. Kept separate from `type` so an office card could reasonably show a building. |
| `mapEmbedUrl` | An `https` map embed. The first published card carrying one supplies the map. |
| `sortOrder` | Published position. |
| `isActive` | The publish flag. An inactive card stays in the admin list and keeps its place, but is never rendered. |

Two rules exist because the alternative is worse than a 400:

- **A card must show something.** A card with no description, no values and no
  action is rejected on create, and the merged record is re-checked on update — so
  the last field of a card cannot be cleared out from under the schema. The admin
  form disables Save and says why.
- **Links are restricted to `https`, `mailto` and `tel`.** These strings become
  `href` attributes on the public page, so this is what stops a `javascript:` URL
  stored in Mongo from being served to every visitor.

An `iconKey` the build does not recognise is still rendered, falling back to an
envelope, because the key is editable data and a card saved against an older build
should not leave a hole in the page.

## Empty and variable states

The grid maps over `getPublicContactCards()` and nothing else. Verified against
the running server and the real database:

| Active cards | Result |
| --- | --- |
| 0 | The grid section is omitted. The heading, form and band still render. The live page has no heading above its cards, so there is nothing left that would read as an empty section. |
| 1 | One column, capped at `max-w-xl` and centred, so the card is not stranded in a third of the page. |
| 2 | Two columns. |
| 3 | Three columns — the live layout. |
| 4+ | Three columns, wrapping onto further rows. |

A card carrying an unknown `iconKey` still renders, and a published card carrying
a `mapEmbedUrl` supplies the map; with none, the form goes full width.

## Request flow

A Server Component never calls our own API, so the page reads the collection
through the service. The site layout is `force-dynamic`, so a card saved in the
admin is live on the next request rather than baked into a build.

```
GET /contact  ──►  getPublicContactCards()   active cards, published order
                   getPublicSiteSettings()    fallback recipient for the CTA
                          │
                          ▼
                  ContactCardGrid        maps over the list
                  ContactMessageSection  form + the first map embed found
                  ContactCtaSection      mailto from the first active card
```

`GET /api/contact-cards` also returns the published cards, for any consumer that
cannot use a Server Component. It exposes nothing the page does not already show.

## Endpoints

| Route | Who | Does |
| --- | --- | --- |
| `GET /api/contact-cards` | public | The published cards, active only, in display order. |
| `POST /api/contact-cards` | admin | Create a card. |
| `PATCH /api/contact-cards/[id]` | admin | Partial save; the merged record is re-validated. |
| `DELETE /api/contact-cards/[id]` | admin | Remove a card. |
| `PUT /api/contact-cards/order` | admin | Reorder, submitting every id at once. |
| `POST /api/contact` | public | Accept a message from the form. |
| `PATCH /api/contact-messages/[id]` | admin | Mark a message read or unread. |
| `DELETE /api/contact-messages/[id]` | admin | Remove a message. |

Admin writes go through `rejectUnauthorizedAdminWrite`, which needs a session and
an exact match against the application origin. Reordering submits every id and the
server refuses the write if the list changed in another tab, so a stale browser
cannot quietly drop a card.

There is no `GET /api/contact-messages`. The inbox is read by the admin page
calling the service, the same way the FAQ editor reads its list, and a browser GET
carries no `origin` header so it could not pass the write authorization anyway.

## The message form

`POST /api/contact` is the one public write in the project, because a visitor has
no session. Three things keep that from becoming an open relay:

1. The body must be JSON.
2. The hidden `website` field must be empty. A submission that fills it is
   answered with a plain success and **nothing is stored** — the trap is checked
   before the other fields, so it does not reveal which of them were wrong. The
   key is then stripped, or the strict schema would reject a perfect submission
   for carrying an unexpected field.
3. Every field is length-capped and the address is format-checked.

Messages are append-only. There is no edit form and the API accepts no field but
`isRead`: a visitor's message is not something an editor should be able to
rewrite. Text submitted is rendered escaped in the admin, and the inbox preserves
whitespace so an address or a list survives the round trip.

## Seeding

```bash
npm run init:contact-cards
```

Like the rest of the project there are no SQL migrations — the Mongoose indexes
plus an idempotent seed script stand in for them. Cards have no slug, so a missing
entry is identified by its label and type; seeding only ever inserts and never
edits a card an admin has changed. Re-running reports
`Added 0 missing contact cards`.

The seeded `tel:` links drop the spaces the display text keeps. The live page
builds `tel:+880 1972-438732`, which is not a valid URI — spaces are not allowed
in one — and works only because clients are lenient about it.

## Overlap with the contact settings

`/admin/settings/contact` holds the header and footer addresses, and
`getPublicSiteSettings().contact.topBarEmails` is what the footer and top bar
render. The cards are a separate, separately ordered collection.

The two can disagree — someone can change the footer address without touching the
cards. That is deliberate: the cards are a curated presentation and the settings
are the canonical contact list. The one place they meet is the closing band, whose
recipient is taken from the published cards and falls back to the site settings.
