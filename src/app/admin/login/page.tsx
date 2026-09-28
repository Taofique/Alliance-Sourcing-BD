import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">CMS Admin</h1>

          <p className="mt-2 text-gray-600">
            Sign in to manage your website content
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
