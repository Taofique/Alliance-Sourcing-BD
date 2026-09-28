import type { Metadata } from "next";
import FooterCtaSettingsForm from "@/components/admin/footer-cta-settings-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPublicSiteSettings } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Footer Call To Action",
};

export default async function FooterCtaSettingsPage() {
  // Authorization happens before any settings are read.
  await requireAdmin();

  const settings = await getPublicSiteSettings();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">
        Footer call to action
      </h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        The full-width cover photograph that sits immediately above the footer.
        It is shown on the homepage only; the same component can be reused on
        other pages later.
      </p>

      <FooterCtaSettingsForm initialCta={settings.footerCta} />
    </section>
  );
}
