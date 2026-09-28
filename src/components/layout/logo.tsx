import Image from "next/image";
import Link from "next/link";
import type { SiteLogo } from "@/types/site-settings";

type LogoProps = {
  logos: SiteLogo[];
  /**
   * `inverse` recolours the wordmark for the dark footer. The navbar keeps the
   * default appearance, because the default is unchanged.
   */
  tone?: "default" | "inverse";
  size?: "sm" | "md";
};

export default function Logo({
  logos,
  tone = "default",
  size = "md",
}: LogoProps) {
  const inverse = tone === "inverse";
  const mark = size === "sm" ? "size-9 rounded-md" : "size-10 rounded-md";
  const titleClass = size === "sm" ? "text-[11px]" : "text-xs";
  const subtitleClass = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <Link
      href="/"
      aria-label="Alliance — Home"
      translate="no"
      className="flex shrink-0 items-center gap-4 transition-opacity hover:opacity-80"
    >
      {logos.map((logo) => (
        <div
          key={logo.key}
          className={`flex items-center gap-2 [&+div]:border-l [&+div]:pl-4 ${
            inverse ? "[&+div]:border-white/25" : "[&+div]:border-gray-300"
          }`}
        >
          <Image
            src={logo.imageUrl}
            alt=""
            width={40}
            height={40}
            className={`${mark} ${inverse ? "bg-white/95" : ""} object-contain`}
          />

          <div
            className={`hidden flex-col font-heading sm:flex ${
              inverse ? "text-white" : ""
            }`}
          >
            <span className={`leading-none font-bold ${titleClass}`}>
              {logo.title}
            </span>

            <span
              className={`leading-none font-semibold ${
                inverse ? "text-cyan-300" : ""
              } ${subtitleClass}`}
            >
              {logo.subtitle}
            </span>
          </div>
        </div>
      ))}
    </Link>
  );
}
