export type SourcingCategoryInput = {
  title: string;
  description: string;
  imageAlt: string;
  sortOrder: number;
  isPublished: boolean;
};
export type SourcingImage = { imageUrl: string; publicId: string };
export type SourcingCategory = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
};
export type AdminSourcingCategory = SourcingCategory & {
  slug: string;
  publicId: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};
export type SourcingSettings = {
  eyebrow: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: "/buying-house";
};

