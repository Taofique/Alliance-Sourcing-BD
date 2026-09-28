import BannerCarousel from "@/components/sections/banner-carousel";
import { getPublishedBanners } from "@/services/banners";

export default async function HomePage() {
  // Read straight from the service: a Server Component never calls our own API.
  const slides = await getPublishedBanners();

  return (
    <section aria-label="Alliance Sourcing BD">
      <BannerCarousel slides={slides} />
    </section>
  );
}
