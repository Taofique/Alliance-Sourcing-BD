export type MachineryCategoryInput = {
  name: string;
  slug: string;
  sortOrder: number;
};

export type MachineryItemInput = {
  categoryId: string;
  slNo: number;
  machineName: string;
  /** "Open" is a real value in this data, so an absent brand is `null`. */
  brand: string | null;
  quantity: number;
  sortOrder: number;
};

/** The admin-managed factory profile document behind the "Own Factory" buttons. */
export type FactoryPdf = {
  url: string;
  publicId: string;
  fileName: string;
};

export type MachineryItem = {
  id: string;
  categoryId: string;
  slNo: number;
  machineName: string;
  brand: string | null;
  quantity: number;
  sortOrder: number;
};

/** One category plus its rows and the total summed at read time. */
export type MachineryCategoryGroup = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  total: number;
  items: MachineryItem[];
};

export type MachineryInventory = {
  categories: MachineryCategoryGroup[];
  grandTotal: number;
};

export type AdminMachineryCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  itemCount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMachineryItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  slNo: number;
  machineName: string;
  brand: string | null;
  quantity: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MachineryFactoryPdf = {
  pdf: FactoryPdf | null;
};
