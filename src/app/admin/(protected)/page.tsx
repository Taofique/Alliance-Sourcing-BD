import { requireAdmin } from "@/lib/admin-session";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <p className="mt-2 text-slate-600">Signed in as {session.user.email}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Website content management</h2>

        <p className="mt-2 text-slate-600">
          Your account is ready. Site settings will be the first editing screen.
        </p>
      </div>
    </section>
  );
}
