import type { SVGProps } from "react";
import type { FooterSocialPlatform } from "@/types/site-settings";

/**
 * lucide-react v1 dropped every brand glyph, so the footer's social row ships
 * its own small set. These are plain, static, decorative SVGs with no scripts
 * and no external references; each link always carries an accessible name, so
 * the icons themselves are always `aria-hidden`.
 */

const paths: Record<FooterSocialPlatform, string[]> = {
  facebook: [
    "M13.5 21.5v-8.2h2.75l.41-3.2H13.5V8.1c0-.93.26-1.56 1.6-1.56h1.71V3.7a23 23 0 0 0-2.38-.12c-2.35 0-3.96 1.44-3.96 4.07v2.35H7.5v3.2h2.97v8.2z",
  ],
  instagram: [
    "M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5zm4.5 4.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zM17.9 6.1a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1z",
  ],
  linkedin: [
    "M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9.4h4v11.1H3zM9.5 9.4h3.83v1.52h.05c.53-.96 1.83-1.98 3.77-1.98 4.03 0 4.78 2.5 4.78 5.88v6.18h-4v-5.48c0-1.31-.02-2.99-1.82-2.99-1.83 0-2.11 1.43-2.11 2.9v5.57h-4z",
  ],
  youtube: [
    "M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 25 25 0 0 0 2 12a25 25 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A25 25 0 0 0 22 12a25 25 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1z",
  ],
  x: [
    "M17.53 3H20.5l-6.49 7.42L21.5 21h-5.86l-4.6-6.01L5.7 21H2.73l6.94-7.93L2.5 3h6.01l4.16 5.5zm-1.04 16.2h1.65L7.6 4.71H5.83z",
  ],
};

type SocialIconProps = SVGProps<SVGSVGElement>;

export function SocialIcon({
  platform,
  ...props
}: SocialIconProps & { platform: FooterSocialPlatform }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[platform].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
