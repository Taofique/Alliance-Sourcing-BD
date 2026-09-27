import { Mail, Phone } from "lucide-react";
import type { SiteContact } from "@/lib/site";
import Container from "@/components/layout/container";

type TopBarProps = {
  contact: SiteContact;
};

export default function TopBar({ contact }: TopBarProps) {
  return (
    <div className="hidden bg-blue-950 py-1.5 text-white md:block">
      <Container className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center">
            {contact.phones.map((phone) => (
              <a
                key={phone.href}
                href={phone.href}
                className="flex items-center gap-2 px-3 text-xs transition-colors first:pl-0 last:pr-0 hover:text-white/80 [&+a]:border-l [&+a]:border-white/20"
              >
                <Phone
                  size={14}
                  className="shrink-0 text-white/80"
                  aria-hidden="true"
                />

                {phone.label}
              </a>
            ))}
          </div>

          <div className="h-4 w-px bg-white/20" aria-hidden="true" />

          <div className="flex flex-wrap items-center gap-y-2">
            {contact.topBarEmails.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="flex items-center gap-2 px-3 text-sm transition-colors first:pl-0 last:pr-0 hover:text-white/80 [&+a]:border-l [&+a]:border-white/20"
              >
                <Mail
                  size={14}
                  className="shrink-0 text-white/80"
                  aria-hidden="true"
                />

                {email}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
