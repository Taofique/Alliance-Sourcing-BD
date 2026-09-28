import { requireAdmin } from "@/lib/admin-session";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <p className="mt-2 text-slate-600">Signed in as {session.user.email}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Website content management</h2>

        <Link
          href="/admin/settings"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit site settings
        </Link>
      </div>
    </section>
  );
}
