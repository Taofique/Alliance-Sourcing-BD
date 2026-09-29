import type { Metadata } from "next";
import AboutBannerSettingsForm from "@/components/admin/about-banner-settings-form";
import { requireAdmin } from "@/lib/admin-session";
import { getPageBanner } from "@/services/page-banners";

export const metadata: Metadata = {
  title: "About Banner",
};

export default async function AboutBannerSettingsPage() {
  // Authorization happens before any settings are read.
  await requireAdmin();

  const banner = await getPageBanner("about");

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">About banner</h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        The cover photograph behind the &ldquo;About Alliance Sourcing BD&rdquo;
        heading on the About page. The heading and tagline are fixed copy, so the
        image is the only thing to configure here. It is stored in the{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">
          page_banners
        </code>{" "}
        collection, one document per page, alongside the other page banners as
        those pages are built.
      </p>

      <AboutBannerSettingsForm page="about" initialImage={banner.image} />
    </section>
  );
}
