import type { ContactCardType } from "@/types/contact-card";

/**
 * The copy on /contact that is not a contact card.
 *
 * Everything a visitor reads as a *card* lives in the `contact_cards` collection
 * instead, so the grid can gain, lose or reorder boxes without a code change. What
 * remains here is the fixed frame around them: the page heading, the message form
 * and the closing call to action.
 */
export const contactMetadata = {
  title: "Contact Us",
  description:
    "Get in touch with Alliance Sourcing BD. We're here to answer your questions and discuss your sourcing needs.",
  openGraph: {
    title: "Contact Us",
    description: "Reach out to discuss your garment sourcing requirements.",
  },
};

export const contactHero = {
  image:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3105a5e1e47bd6c51724d9ef89fd867243462197-jU21omSUdf2kP7KEQVK23sTylm4Hqd.jpg",
  title: "Get in Touch",
  subtitle:
    "We're here to answer your questions and discuss your sourcing needs",
  breadcrumbLabel: "Contact Us",
};

export const contactMessage = {
  heading: "Send us a Message",
  subtitle: "Have questions? We'd love to hear from you.",
  submitLabel: "Send Message",
  successMessage: "Thank you! Your message has been sent successfully.",
  errorMessage: "Something went wrong. Please try again.",
  placeholders: {
    name: "John Doe",
    email: "john@example.com",
    subject: "How can we help?",
    message: "Tell us about your sourcing needs...",
  },
};

export const contactCta = {
  image:
    "https://i.postimg.cc/3NcsYzxX/multi-colored-garments-hanging-coathangers-boutique-store-generated-by-ai.jpg",
  heading: "Ready to get started?",
  description:
    "Connect with us today to discuss your apparel sourcing requirements",
  label: "Contact Us",
};

/**
 * Shown instead of the grid when no card is active.
 *
 * The live page drops straight from the hero into the cards with no heading of
 * its own, so there is nothing here that would read as an empty section — the
 * grid is omitted and the page continues with the form.
 */
export const contactCardsEmptyNote = "No contact cards are published yet.";

/** Word used in place of the card label for a type, used by the admin list. */
export const CONTACT_TYPE_LABELS: Record<ContactCardType, string> = {
  email: "Email",
  phone: "Phone",
  office: "Office",
  hours: "Hours",
};
