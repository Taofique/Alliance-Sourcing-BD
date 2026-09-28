type SectionHeadingProps = {
  /** The one `h2` for the section. Callers supply the id used by `aria-labelledby`. */
  id: string;
  eyebrow: string;
  heading: string;
  lede?: string;
  /** `center` for grid sections, `left` for the split image/text sections. */
  align?: "center" | "left";
  className?: string;
};

/**
 * The eyebrow + heading + lede block shared by every static homepage section.
 *
 * Keeping it in one place is what makes the six sections read as one page: the
 * same type scale, the same cyan eyebrow, the same measure on the lede.
 */
export default function SectionHeading({
  id,
  eyebrow,
  heading,
  lede,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={`${
        centered ? "mx-auto mb-10 max-w-2xl text-center md:mb-14" : ""
      } ${className}`}
    >
      <p className="mb-2 text-xs font-semibold tracking-widest text-cyan-600 uppercase sm:text-sm">
        {eyebrow}
      </p>

      <h2
        id={id}
        className="font-heading text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl"
      >
        {heading}
      </h2>

      {lede && (
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
          {lede}
        </p>
      )}
    </div>
  );
}
