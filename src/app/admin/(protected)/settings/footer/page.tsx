import type { Metadata } from "next";
import FooterSettingsForm from "@/components/admin/footer-settings-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPublicSiteSettings, getStoredSiteFooter } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Footer",
};

export default async function FooterSettingsPage() {
  // Authorization happens before any settings are read.
  await requireAdmin();

  const [settings, storedFooter] = await Promise.all([
    getPublicSiteSettings(),
    getStoredSiteFooter(),
  ]);

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Footer</h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        The dark footer at the bottom of every public page. Phone numbers and
        the two header emails are reused from Contact details; anything left
        empty here is simply hidden on the website.
      </p>

      <FooterSettingsForm
        initialFooter={storedFooter}
        contact={settings.contact}
      />
    </section>
  );
}
