import type { Metadata } from "next";
import BannerEditor from "@/components/admin/banner-editor";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminBanners } from "@/services/banners";

export const metadata: Metadata = {
  title: "Banners",
};

export default async function BannersPage() {
  // Authorization happens before any banner data is read.
  await requireAdmin();

  const banners = await getAdminBanners();

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Banners</h1>

      <p className="mt-2 max-w-2xl text-slate-600">
        The published slides are the homepage carousel. Drafts stay hidden.
        Reload an already-open homepage tab to see a change there.
      </p>

      <div className="mt-8">
        <BannerEditor banners={banners} />
      </div>
    </section>
  );
}
