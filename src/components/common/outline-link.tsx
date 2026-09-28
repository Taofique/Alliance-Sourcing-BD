import Link from "next/link";

type OutlineLinkProps = {
  href: string;
  children: string;
  className?: string;
};

const OUTLINE_BUTTON =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-transparent px-6 py-3 text-sm font-medium text-slate-800 transition-colors duration-200 hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 motion-reduce:transition-none";

/**
 * The quiet outline CTA the reference used beside the section copy, restyled
 * onto this project's cyan accent. Every destination is a real route, so the
 * button never degrades to a dead "#".
 */
export default function OutlineLink({
  href,
  children,
  className = "",
}: OutlineLinkProps) {
  return (
    <Link href={href} className={`${OUTLINE_BUTTON} ${className}`}>
      {children}
    </Link>
  );
}
