import type { Metadata } from "next";
import ContactSettingsForm from "@/components/admin/contact-settings-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPublicSiteSettings } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Site Settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  const settings = await getPublicSiteSettings();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Site settings</h1>

      <p className="mt-2 text-slate-600">
        Update the contact details displayed in the website header.
      </p>

      <ContactSettingsForm initialContact={settings.contact} />
    </section>
  );
}
