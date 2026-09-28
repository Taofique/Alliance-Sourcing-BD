import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/admin-shell";
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
  // The shared layout never reads CMS data: each page loads only what it edits.
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
