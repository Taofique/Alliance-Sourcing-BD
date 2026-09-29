import Image from "next/image";

type MachineryFeatureCardProps = {
  image: string;
  title: string;
  imageAlt: string;
};

/**
 * One machine photograph with its name, used for the "Advanced Machinery"
 * highlights.
 *
 * The image keeps a fixed aspect ratio so a row of cards lines up whatever the
 * source dimensions are, and `object-cover` prevents a tall original from
 * distorting the frame.
 */
export default function MachineryFeatureCard({
  image,
  title,
  imageAlt,
}: MachineryFeatureCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="px-5 py-5 text-center">
        <h3 className="font-heading text-lg font-bold text-slate-900">
          {title}
        </h3>
      </div>
    </article>
  );
}
