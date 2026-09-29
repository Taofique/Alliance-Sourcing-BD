/**
 * The initial machinery inventory, seeded by `npm run init:machinery`.
 *
 * This is the source of truth for a fresh install, so the numbers here are the
 * ones the public page and the acceptance criteria are written against:
 * Cutting 20, Sewing 213, Finishing 54, Embroidery 6, grand total 293.
 *
 * Those totals are never stored. They are summed from `quantity` at read time,
 * so editing a row in the admin immediately changes the published figures.
 */
export type SeedMachineryItem = {
  machineName: string;
  brand: string | null;
  quantity: number;
};

export type SeedMachineryCategory = {
  name: string;
  slug: string;
  items: SeedMachineryItem[];
};

export const initialMachineryCategories: SeedMachineryCategory[] = [
  {
    name: "Cutting Machinery",
    slug: "cutting-machinery",
    items: [
      { machineName: 'Cutting Machine 8"', brand: "KM", quantity: 3 },
      { machineName: 'Cutting Machine 8"', brand: "Open", quantity: 1 },
      { machineName: 'Cutting Machine 10"', brand: "KM", quantity: 3 },
      { machineName: "Fabric Inspection Machine", brand: "Open", quantity: 1 },
      { machineName: "Drill Machine", brand: "Open", quantity: 2 },
      { machineName: "Fusing Machine (Medium) HP-650", brand: "Open", quantity: 2 },
      { machineName: "Numbering Machine", brand: "Open", quantity: 5 },
      { machineName: "End Cutting Machine", brand: "Eastman", quantity: 2 },
      // Spelled exactly as the reference publishes it.
      { machineName: "Band Knife Machine1", brand: "Open", quantity: 1 },
    ],
  },
  {
    name: "Sewing Machinery",
    slug: "sewing-machinery",
    items: [
      { machineName: "Plain Machine", brand: "Juki", quantity: 120 },
      { machineName: "Overlock Machine", brand: "Pegasus", quantity: 45 },
      { machineName: "Flat Lock Machine", brand: "Pegasus", quantity: 20 },
      { machineName: "Feed of the Arm", brand: "Juki", quantity: 8 },
      { machineName: "Button Hole Machine", brand: "Juki", quantity: 6 },
      { machineName: "Button Stitch Machine", brand: "Juki", quantity: 6 },
      { machineName: "Bar Tack Machine", brand: "Juki", quantity: 4 },
      { machineName: "Kansai Machine", brand: "Kansai", quantity: 4 },
    ],
  },
  {
    name: "Finishing Machinery",
    slug: "finishing-machinery",
    items: [
      { machineName: "Steam Iron", brand: "Tefal", quantity: 30 },
      { machineName: "Vacuum Iron Table", brand: "Open", quantity: 15 },
      { machineName: "Boiler", brand: "Open", quantity: 2 },
      { machineName: "Pressing Machine", brand: "Open", quantity: 4 },
      { machineName: "Hanger Clipping Machine", brand: "Open", quantity: 3 },
    ],
  },
  {
    name: "Embroidery Machinery",
    slug: "embroidery-machinery",
    items: [
      { machineName: "Embroidery Machine (15 Head)", brand: "Tajima", quantity: 2 },
      { machineName: "Embroidery Machine (6 Head)", brand: "Tajima", quantity: 1 },
      { machineName: "Embroidery Machine (2 Head)", brand: "Open", quantity: 3 },
    ],
  },
];

/** Cloudinary folder for the admin-managed factory profile PDF. */
export const FACTORY_PDF_FOLDER = "alliance-sourcing-bd/documents";
