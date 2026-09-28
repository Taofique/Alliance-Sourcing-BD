import type { ReactNode } from "react";
import TopBar from "@/components/layout/top-bar";
import Navbar from "@/components/layout/navbar";
import Logo from "@/components/layout/logo";
import Footer from "@/components/layout/footer";
import PublicBrandingLoader from "@/components/common/public-branding-loader";
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
        The public branded loader. It lives in this layout, so a completed
        pathname change is detected without the layout remounting.
      */}
      <PublicBrandingLoader
        logos={settings.logos.map((logo) => ({
          src: logo.imageUrl,
          alt: logo.title,
        }))}
      />
    </div>
  );
}
