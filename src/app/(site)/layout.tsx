import type { ReactNode } from "react";
import TopBar from "@/components/layout/top-bar";
import Navbar from "@/components/layout/navbar";
import Logo from "@/components/layout/logo";
import { getPublicSiteSettings } from "@/services/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SiteLayoutProps = {
  children: ReactNode;
};

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const settings = await getPublicSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar contact={settings.contact} />

      <Navbar contact={settings.contact}>
        <Logo logos={settings.logos} />
      </Navbar>

      <main className="flex-1">{children}</main>
    </div>
  );
}
