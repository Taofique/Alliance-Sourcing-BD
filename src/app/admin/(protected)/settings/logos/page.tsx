import type { Metadata } from "next";
import LogoUploadForm from "@/components/admin/logo-upload-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPublicSiteSettings } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Logos",
};

export default async function LogoSettingsPage() {
  await requireAdmin();

  const settings = await getPublicSiteSettings();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Logos</h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        Replace the brand logos shown in the website header. Each upload updates
        the live header straight away.
      </p>

      <div className="mt-6 grid max-w-5xl gap-6 md:grid-cols-2">
        {settings.logos.map((logo) => (
          <LogoUploadForm key={logo.key} logo={logo} />
        ))}
      </div>
    </section>
  );
}
