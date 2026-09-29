/** The stored photograph for one product, as uploaded through the admin. */
export type ProductImage = {
  url: string;
  publicId: string;
};

export type ProductCategoryInput = {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type ProductSubcategoryInput = {
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type ProductInput = {
  subcategoryId: string;
  name: string;
  image: ProductImage;
  sortOrder: number;
  isActive: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                 */
/* -------------------------------------------------------------------------- */

export type InitialProduct = {
  name: string;
  imageUrl: string;
  publicId: string;
};

export type InitialProductSubcategory = {
  name: string;
  slug: string;
  products: InitialProduct[];
};

export type InitialProductCategory = {
  name: string;
  slug: string;
  subcategories: InitialProductSubcategory[];
};

export type InitialProductCatalogue = InitialProductCategory[];

/* -------------------------------------------------------------------------- */
/*  Public                                                                    */
/* -------------------------------------------------------------------------- */

export type PublicProduct = {
  id: string;
  name: string;
  imageUrl: string;
};

export type PublicProductSubcategory = {
  id: string;
  name: string;
  productCount: number;
  products: PublicProduct[];
};

export type PublicProductCategory = {
  id: string;
  name: string;
  subcategories: PublicProductSubcategory[];
};

export type ProductCatalog = {
  categories: PublicProductCategory[];
};

/* -------------------------------------------------------------------------- */
/*  Admin                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminProductCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  /** Counted from the subcategories on every read, never stored. */
  subcategoryCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductSubcategory = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  /** Counted from the products on every read, never stored. */
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProduct = {
  id: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryName: string;
  name: string;
  image: ProductImage;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
