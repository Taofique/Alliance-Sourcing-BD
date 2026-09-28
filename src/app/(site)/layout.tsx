import type { ReactNode } from "react";
import TopBar from "@/components/layout/top-bar";
import Navbar from "@/components/layout/navbar";
import Logo from "@/components/layout/logo";
import { siteContact } from "@/lib/site";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar contact={siteContact} />

      <Navbar contact={siteContact}>
        <Logo />
      </Navbar>

      <main className="flex-1">{children}</main>
    </div>
  );
}
