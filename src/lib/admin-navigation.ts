import {
  Boxes,
  Contact,
  Factory,
  FileText,
  Images,
  LayoutDashboard,
  Megaphone,
  PanelBottom,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AdminNavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type AdminNavGroup = {
  label: string;
  icon: LucideIcon;
  /** Set for a plain top-level link; omit it to get an expandable group. */
  href?: string;
  children?: AdminNavLink[];
};

/**
 * Only working editor links are listed. Sections still to be built — statistics,
 * features, workflow, services, catalog, CTA, About, Sister concern, Global
 * partners and Products — are added here as their routes land, so no
 * placeholder or dead link is ever rendered.
 */
export const adminNavigation: AdminNavGroup[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Site settings",
    icon: Settings,
    children: [
      {
        label: "Contact details",
        href: "/admin/settings/contact",
        icon: Contact,
        description: "Phone numbers and emails shown in the website header.",
      },
      {
        label: "Logos",
        href: "/admin/settings/logos",
        icon: Images,
        description: "Upload the header brand logos.",
      },
      {
        label: "Footer",
        href: "/admin/settings/footer",
        icon: PanelBottom,
        description: "Links, contact details, social and legal links in the footer.",
      },
      {
        label: "Footer call to action",
        href: "/admin/settings/footer-cta",
        icon: Megaphone,
        description: "The cover photograph and button above the footer.",
      },
    ],
  },
  {
    label: "Homepage",
    icon: Images,
    children: [
      {
        label: "Banners",
        href: "/admin/banners",
        icon: Images,
        description: "Manage the homepage banner carousel slides.",
      },
      {
        label: "What we source",
        href: "/admin/home/sourcing",
        icon: Images,
        description: "Manage sourcing categories and section settings.",
      },
    ],
  },
  {
    label: "Pages",
    icon: Images,
    children: [
      {
        label: "About banner",
        href: "/admin/pages/about-banner",
        icon: Images,
        description: "The cover photograph behind the About page heading.",
      },
    ],
  },
  {
    label: "Machinery",
    icon: Factory,
    children: [
      {
        label: "Categories",
        href: "/admin/machinery/categories",
        icon: Boxes,
        description: "The groups shown on the Factory & Machinery page.",
      },
      {
        label: "Machines",
        href: "/admin/machinery/items",
        icon: Factory,
        description: "Every machine, its quantity and where it sits in the table.",
      },
      {
        label: "Factory profile PDF",
        href: "/admin/machinery/factory-pdf",
        icon: FileText,
        description: "The document behind the Own Factory download buttons.",
      },
    ],
  },
];

/** Segment-aware match: /admin/banners matches, /admin/banners-archive does not. */
export function isAdminLinkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminSection(pathname: string | null) {
  for (const group of adminNavigation) {
    if (group.href && isAdminLinkActive(pathname, group.href)) {
      return { group: group.label, link: null };
    }

    for (const link of group.children ?? []) {
      if (isAdminLinkActive(pathname, link.href)) {
        return { group: group.label, link };
      }
    }
  }

  return null;
}
