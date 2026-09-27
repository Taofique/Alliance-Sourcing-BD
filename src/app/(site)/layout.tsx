import type { ReactNode } from "react";
import TopBar from "@/components/layout/top-bar";
import { siteContact } from "@/lib/site";

type siteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: siteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header>
        <TopBar contact={siteContact}></TopBar>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
