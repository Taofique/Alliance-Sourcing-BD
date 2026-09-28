import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { adminNavigation } from "@/lib/admin-navigation";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const groups = adminNavigation.filter((group) => group.children?.length);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <p className="mt-2 text-slate-600">Signed in as {session.user.email}</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Content editors
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {groups.flatMap((group) =>
          group.children!.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <link.icon className="size-5" aria-hidden="true" />
                </span>

                <span>
                  <span className="block text-xs font-medium tracking-wide text-slate-500 uppercase">
                    {group.label}
                  </span>
                  <span className="block text-base font-semibold text-slate-900">
                    {link.label}
                  </span>
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-600">{link.description}</p>
            </Link>
          )),
        )}
      </div>
    </div>
  );
}
