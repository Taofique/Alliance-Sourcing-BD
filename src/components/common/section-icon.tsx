import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Cog,
  Factory,
  Gauge,
  Grid3x3,
  Handshake,
  Layers,
  Package,
  Scissors,
  ShieldCheck,
  Shirt,
  Ship,
  Wrench,
  Building2,
} from "lucide-react";
import type { HomepageIconKey } from "@/types/homepage-sections";

/**
 * The one place a section icon key becomes a glyph.
 *
 * The bundled `public/icons` set only covers the four "What sets us apart"
 * cards, so everything else resolves through this map. Lucide is already a
 * dependency used across the project, so this adds no new icon library.
 */
const ICONS: Record<HomepageIconKey, LucideIcon> = {
  sampling: Package,
  supplier: Building2,
  negotiation: Handshake,
  inspection: ClipboardCheck,
  compliance: ShieldCheck,
  shipping: Ship,
  knitwear: Shirt,
  denim: Layers,
  woven: Grid3x3,
  accessories: Scissors,
  production: Factory,
  maintenance: Wrench,
  machinery: Cog,
  optimization: Gauge,
};

type SectionIconProps = {
  name: HomepageIconKey;
  className?: string;
};

/** Always decorative: the adjacent heading or card title already names it. */
export default function SectionIcon({ name, className }: SectionIconProps) {
  const Icon = ICONS[name];

  return <Icon className={className} aria-hidden="true" />;
}
