export type BannerCta = {
  text: string;
  href: string;
};

export type BannerSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  cta: BannerCta | null;
};

export type AdminBanner = BannerSlide & {
  publicId: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BannerInput = {
  title: string;
  description: string;
  imageAlt: string;
  cta: BannerCta | null;
  sortOrder: number;
  isPublished: boolean;
};

export type BannerImageReference = {
  imageUrl: string;
  publicId: string;
};
