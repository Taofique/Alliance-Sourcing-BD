import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  /** Omit for the page you are currently on; it renders as plain text. */
  href?: string;
};

type PageBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * The "Home > Current page" trail shown above a page heading.
 *
 * The last item is always plain text with `aria-current="page"`, so the current
 * page is highlighted for sighted users and announced correctly by a screen
 * reader. Chevron separators are decorative and hidden from assistive tech.
 */
export default function PageBreadcrumb({
  items,
  className = "",
}: PageBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 text-sm text-white/80 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-white motion-reduce:transition-none"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium text-white"
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </nav>
  );
}
