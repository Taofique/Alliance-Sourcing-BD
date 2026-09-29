import Container from "@/components/layout/container";
import { ContactCardGlyph } from "@/lib/contact-card-icons";
import type { ContactCard } from "@/types/contact-card";

type ContactCardGridProps = {
  cards: ContactCard[];
};

/**
 * The boxes at the top of /contact, one per active record in the `contact_cards`
 * collection.
 *
 * There is no expected number of cards anywhere in this component. It maps over
 * whatever `getPublicContactCards` returned, so a collection holding one card, or
 * six, renders one card or six — and the column count follows the count so a
 * single card does not sit in a third of the page on its own.
 *
 * When nothing is active the whole section is dropped. The live page has no
 * heading above its cards, so an empty grid would be a band of nothing between the
 * hero and the form; omitting it leaves a shorter, honest page instead.
 */
export default function ContactCardGrid({ cards }: ContactCardGridProps) {
  if (cards.length === 0) return null;

  return (
    <section className="py-16" aria-label="Contact details">
      <Container>
        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${columnsFor(cards.length)}`}>
          {cards.map((card) => (
            <ContactCardBox key={card.id} card={card} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * Three cards, the live layout, get three columns. Fewer are centred rather than
 * stretched across a row they do not fill; more wrap onto further rows.
 */
function columnsFor(count: number) {
  if (count === 1) return "md:grid-cols-1 md:max-w-xl md:mx-auto";
  if (count === 2) return "md:grid-cols-2";
  return "md:grid-cols-2 lg:grid-cols-3";
}

function ContactCardBox({ card }: { card: ContactCard }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-cyan-50 transition-colors duration-300 group-hover:bg-cyan-100 motion-reduce:transition-none">
        <ContactCardGlyph iconKey={card.iconKey} className="size-6 text-cyan-600" />
      </div>

      <h2 className="font-heading mb-2 text-xl font-bold text-slate-900">
        {card.label}
      </h2>

      {card.description && (
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          {card.description}
        </p>
      )}

      {card.values.length > 0 && (
        <ul
          className={`flex flex-col gap-3 ${
            card.description ? "" : "mb-6"
          }`}
        >
          {card.values.map((value) => (
            <li key={`${card.id}-${value.text}`}>
              {value.href ? (
                <a
                  href={value.href}
                  className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  {value.text}
                </a>
              ) : (
                <span className="text-sm leading-relaxed text-slate-600">
                  {value.text}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {card.action && (
        <a
          href={card.action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
        >
          {card.action.label}
          <span
            aria-hidden="true"
            className="h-px w-4 bg-cyan-600 transition-all duration-300 group-hover/link:w-8 motion-reduce:transition-none"
          />
        </a>
      )}
    </div>
  );
}
