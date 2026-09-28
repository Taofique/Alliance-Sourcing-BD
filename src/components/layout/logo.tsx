import Image from "next/image";
import Link from "next/link";

const brands = [
  {
    src: "/logo2.png",
    subtitle: "APPARELS LTD.",
  },
  {
    src: "/logo.jpg",
    subtitle: "SOURCING BD",
  },
];

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="Alliance Apparels and Alliance Sourcing BD — Home"
      className="flex shrink-0 items-center gap-4 transition-opacity hover:opacity-80"
    >
      {brands.map((brand) => (
        <div
          key={brand.src}
          translate="no"
          className="flex items-center gap-2 [&+div]:border-l [&+div]:border-gray-300 [&+div]:pl-4"
        >
          <Image
            src={brand.src}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-md object-contain"
          />

          <div className="hidden flex-col font-heading sm:flex">
            <span className="text-xs leading-none font-bold">ALLIANCE</span>
            <span className="text-[10px] leading-none font-semibold">
              {brand.subtitle}
            </span>
          </div>
        </div>
      ))}
    </Link>
  );
}
