import type { ReactNode } from "react";
import TopBar from "@/components/layout/top-bar";
import Navbar from "@/components/layout/navbar";
import Logo from "@/components/layout/logo";
import Footer from "@/components/layout/footer";
import PublicBrandingLoader from "@/components/common/public-branding-loader";
import BackToTop from "@/components/common/back-to-top";
import { getPublicSiteSettings } from "@/services/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SiteLayoutProps = {
  children: ReactNode;
};

export default async function SiteLayout({ children }: SiteLayoutProps) {
  // One read serves the header, the footer and the loader's saved logos.
  const settings = await getPublicSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar contact={settings.contact} />

      <Navbar contact={settings.contact}>
        <Logo logos={settings.logos} />
      </Navbar>

      <main className="flex-1">{children}</main>

      {/* The footer belongs to the public layout only, never to /admin. */}
      <Footer
        logos={settings.logos}
        contact={settings.contact}
        footer={settings.footer}
      />

      {/*
        The public branded loader. It lives in this layout, so the landing-page
        introduction is shown from the server HTML and can stand down for a real
        `loading.tsx` wait without the layout remounting.
      */}
      <PublicBrandingLoader
        logos={settings.logos.map((logo) => ({
          src: logo.imageUrl,
          alt: logo.title,
        }))}
      />

      {/* Appears once the reader has scrolled far enough to want it. */}
      <BackToTop />
    </div>
  );
}
