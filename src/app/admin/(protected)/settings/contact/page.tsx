import type { Metadata } from "next";
import ContactSettingsForm from "@/components/admin/contact-settings-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPublicSiteSettings } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Contact Details",
};

export default async function ContactSettingsPage() {
  await requireAdmin();

  const settings = await getPublicSiteSettings();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Contact details</h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        Update the phone numbers and email addresses displayed in the website
        header.
      </p>

      <ContactSettingsForm initialContact={settings.contact} />
    </section>
  );
}
