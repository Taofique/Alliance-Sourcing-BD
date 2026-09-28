import Image from "next/image";
import Link from "next/link";
import type { SiteLogo } from "@/types/site-settings";

type LogoProps = {
  logos: SiteLogo[];
};

export default function Logo({ logos }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Alliance — Home"
      className="flex shrink-0 items-center gap-4 transition-opacity hover:opacity-80"
    >
      {logos.map((logo) => (
        <div
          key={logo.key}
          translate="no"
          className="flex items-center gap-2 [&+div]:border-l [&+div]:border-gray-300 [&+div]:pl-4"
        >
          <Image
            src={logo.imageUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-md object-contain"
          />

          <div className="hidden flex-col font-heading sm:flex">
            <span className="text-xs leading-none font-bold">{logo.title}</span>

            <span className="text-[10px] leading-none font-semibold">
              {logo.subtitle}
            </span>
          </div>
        </div>
      ))}
    </Link>
  );
}
