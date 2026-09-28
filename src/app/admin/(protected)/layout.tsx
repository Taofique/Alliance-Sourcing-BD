import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "@/components/admin/logout-button";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="text-lg font-bold">
            Alliance CMS
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-blue-600">
              View website
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
