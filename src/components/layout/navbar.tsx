"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Container from "@/components/layout/container";
import { navigation, type SiteContact } from "@/lib/site";

type NavbarProps = {
  children: ReactNode;
  contact: SiteContact;
};

export default function Navbar({ children, contact }: NavbarProps) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isOpen = openPath === pathname;

  const email = contact.topBarEmails[0];
  const phone = contact.phones[0];

  function isActive(href: string) {
    return (
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    );
  }

  function closeMenu() {
    setOpenPath(null);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <Container>
        <nav
          aria-label="Main navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape" && isOpen) {
              closeMenu();
              toggleRef.current?.focus();
            }
          }}
        >
          <div className="flex h-16 items-center justify-between gap-4">
            {children}

            <div className="hidden items-center gap-8 xl:flex">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`border-b-2 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive(item.href)
                      ? "border-cyan-600 text-cyan-600"
                      : "border-transparent text-slate-700 hover:text-cyan-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {email && (
              <a
                href={`mailto:${email}`}
                className="speak-link hidden shrink-0 xl:inline-flex"
              >
                Speak with us
              </a>
            )}

            <button
              ref={toggleRef}
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setOpenPath(isOpen ? null : pathname);
              }}
              className="flex size-11 items-center justify-center rounded-md text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 xl:hidden"
            >
              {isOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                <Menu size={24} aria-hidden="true" />
              )}
            </button>
          </div>

          <div
            id="mobile-navigation"
            hidden={!isOpen}
            className="space-y-2 pb-4 xl:hidden"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-cyan-50 text-cyan-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-cyan-600"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {phone && (
              <a
                href={phone.href}
                onClick={closeMenu}
                className="speak-link mt-2 w-full"
              >
                Speak with us
              </a>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
}
