import type { Metadata } from "next";
import PageHero from "@/components/common/page-hero";
import ContactCardGrid from "@/components/sections/contact-card-grid";
import ContactCtaSection from "@/components/sections/contact-cta-section";
import ContactMessageSection from "@/components/sections/contact-message-section";
import {
  contactHero,
  contactMetadata,
} from "@/lib/contact-sections";
import { getPublicContactCards } from "@/services/contact-card";
import { getPublicSiteSettings } from "@/services/site-settings";
import type { ContactCard } from "@/types/contact-card";

export const metadata: Metadata = {
  title: contactMetadata.title,
  description: contactMetadata.description,
  openGraph: contactMetadata.openGraph,
};

/**
 * /contact
 *
 * The card grid is database-driven: `getPublicContactCards` returns every active
 * card in display order and the grid maps over whatever it finds, so the number
 * of cards is the collection's business, not this page's. With none active the
 * grid is omitted and the page still shows the hero, the form and the call to
 * action.
 *
 * A Server Component never calls our own API, so the page reads the collection
 * through the service instead of fetching `/api/contact-cards`. The site layout is
 * already `force-dynamic`, so a card saved in the admin is live on the next request.
 */
export default async function ContactPage() {
  const [cards, settings] = await Promise.all([
    getPublicContactCards(),
    getPublicSiteSettings(),
  ]);

  return (
    <>
      <PageHero
        id="contact-title"
        image={contactHero.image}
        title={contactHero.title}
        subtitle={contactHero.subtitle}
        breadcrumbLabel={contactHero.breadcrumbLabel}
      />

      <ContactCardGrid cards={cards} />

      <ContactMessageSection mapEmbedUrl={mapEmbedFor(cards)} />

      <ContactCtaSection mailto={mailtoFor(cards, settings.contact.topBarEmails)} />
    </>
  );
}

/**
 * The first active card carrying a map embed, so the pin sits beside whichever
 * card describes the office. A collection with none simply shows no map.
 */
function mapEmbedFor(cards: ContactCard[]): string | null {
  return cards.find((card) => card.mapEmbedUrl)?.mapEmbedUrl ?? null;
}

/**
 * Where the call-to-action button writes to.
 *
 * The published cards are the authority, so the first `mailto:` value on an active
 * card wins. The site's contact settings are the fallback for a page whose cards
 * have been edited away. The contact schema holds two addresses, so this normally
 * resolves; if it somehow cannot, an empty recipient still opens a blank compose
 * rather than a link to nowhere.
 */
function mailtoFor(cards: ContactCard[], fallbackEmails: string[]): string {
  const fromCard = cards
    .flatMap((card) => card.values)
    .map((value) => value.href)
    .find((href): href is string => Boolean(href?.startsWith("mailto:")))
    ?.replace(/^mailto:/, "");

  return fromCard ?? fallbackEmails[0] ?? "";
}
