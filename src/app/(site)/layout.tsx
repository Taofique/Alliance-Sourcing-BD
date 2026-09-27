import type { ReactNode } from "react";

type siteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: siteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
