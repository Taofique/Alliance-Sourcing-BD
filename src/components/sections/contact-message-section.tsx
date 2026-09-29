import ContactMessageForm from "@/components/sections/contact-message-form";
import { contactMessage } from "@/lib/contact-sections";

type ContactMessageSectionProps = {
  /**
   * An `https` map embed taken from whichever active card carries one, or null.
   *
   * The map lives with the office card rather than in this component so the
   * address and the pin can never disagree, and so an office card can drop the
   * map by clearing one field.
   */
  mapEmbedUrl: string | null;
};

/**
 * The message form and the map, side by side at the foot of /contact.
 *
 * The map column disappears when no card supplies an embed, which leaves the form
 * full width rather than beside an empty box.
 */
export default function ContactMessageSection({
  mapEmbedUrl,
}: ContactMessageSectionProps) {
  return (
    <section className="pb-10 lg:pb-20" aria-labelledby="contact-message-heading">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 md:grid-cols-2">
        <div className="h-full rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <h2
            id="contact-message-heading"
            className="font-heading mb-2 text-3xl font-bold text-slate-900"
          >
            {contactMessage.heading}
          </h2>
          <p className="mb-8 text-sm text-slate-500">
            {contactMessage.subtitle}
          </p>

          <ContactMessageForm />
        </div>

        {mapEmbedUrl && (
          <iframe
            src={mapEmbedUrl}
            title="Map showing the Alliance Sourcing BD office"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-80 w-full border-0"
            allowFullScreen
          />
        )}
      </div>
    </section>
  );
}
