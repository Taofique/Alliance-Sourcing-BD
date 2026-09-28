import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Container from "@/components/layout/container";
import Logo from "@/components/layout/logo";
import { SocialIcon } from "@/components/layout/social-icon";
import type {
  FooterLink,
  FooterSocialPlatform,
  SiteContact,
  SiteFooter,
  SiteLogo,
} from "@/types/site-settings";

type FooterProps = {
  logos: SiteLogo[];
  contact: SiteContact;
  footer: SiteFooter;
};

/**
 * The reference's supported platform list. A platform with no configured URL
 * is simply not rendered, so the footer never shows a dead "#" link.
 */
const socialLabels: Record<FooterSocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X (Twitter)",
};

/** Internal destinations go through next/link; everything else is a plain anchor. */
function FooterNavLink({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-slate-400 transition-colors hover:text-cyan-400";

  return link.href.startsWith("/") ? (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  ) : (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  );
}

export default function Footer({ logos, contact, footer }: FooterProps) {
  // Evaluated on the server per request, so the year is always current.
  const currentYear = new Date().getFullYear();
  const owner = footer.copyrightOwner.trim();

  const whatsappDigits = footer.whatsappNumber.replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}${
        footer.whatsappMessage.trim()
          ? `?text=${encodeURIComponent(footer.whatsappMessage.trim())}`
          : ""
      }`
    : "";

  const hasContactBlock = Boolean(
    footer.emails.length ||
      contact.phones.length ||
      footer.address.trim(),
  );

  return (
    <footer className="mt-auto bg-slate-900 text-white">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Logo logos={logos} tone="inverse" />

            {footer.brandDescription.trim() && (
              <p className="mt-4 max-w-xs text-sm text-slate-400">
                {footer.brandDescription}
              </p>
            )}
          </div>

          {/* Quick links */}
          {footer.quickLinks.length > 0 && (
            <div>
              <h2 className="font-heading text-base font-semibold text-white">
                Quick Links
              </h2>

              <ul className="mt-4 space-y-2">
                {footer.quickLinks.map((link) => (
                  <li key={link.id}>
                    <FooterNavLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact — reuses the saved header phone numbers and emails */}
          {hasContactBlock && (
            <div>
              <h2 className="font-heading text-base font-semibold text-white">
                Contact
              </h2>

              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                {footer.emails.map((email) => (
                  <li key={`footer-email-${email}`}>
                    <a
                      href={`mailto:${email}`}
                      className="block transition-colors hover:text-cyan-400"
                    >
                      {email}
                    </a>
                  </li>
                ))}

                {contact.phones.map((phone) => (
                  <li key={`footer-phone-${phone.href}`}>
                    <a
                      href={phone.href}
                      className="block transition-colors hover:text-cyan-400"
                    >
                      {phone.label}
                    </a>
                  </li>
                ))}

                {footer.address.trim() && (
                  <li className="pt-1 leading-relaxed">{footer.address}</li>
                )}
              </ul>
            </div>
          )}

          {/* Social + WhatsApp */}
          {(footer.socials.length > 0 || whatsappHref) && (
            <div>
              <h2 className="font-heading text-base font-semibold text-white">
                Connect With Us
              </h2>

              {footer.socials.length > 0 && (
                <ul className="mt-4 flex gap-3">
                  {footer.socials.map((social) => {
                    const external = !social.href.startsWith("/");

                    return (
                      <li key={social.platform}>
                        <a
                          href={social.href}
                          title={socialLabels[social.platform]}
                          aria-label={socialLabels[social.platform]}
                          {...(external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="flex size-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-cyan-400"
                        >
                          <SocialIcon platform={social.platform} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              {whatsappHref && (
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Chat with us</h3>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 hover:shadow-lg"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    <span className="sr-only sm:hidden">
                      Chat on WhatsApp
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-800" />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row md:gap-0">
          <p>
            &copy; {currentYear} {owner || "Alliance Sourcing BD"}. All rights
            reserved.
          </p>

          {(footer.legalLinks.length > 0 || footer.attribution) && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {footer.legalLinks.map((link) => (
                <FooterNavLink key={link.id} link={link} />
              ))}

              {footer.attribution && (
                <a
                  href={footer.attribution.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cyan-400"
                >
                  {footer.attribution.label}
                </a>
              )}
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}
