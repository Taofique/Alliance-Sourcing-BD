import Image from "next/image";
import type { PublicProduct } from "@/types/products";

type ProductCardProps = {
  product: PublicProduct;
};

/**
 * One garment card in the catalogue grid.
 *
 * Ported from the reference `ProductShowcase` markup so the published page is
 * visually identical: the same 4:5 frame, the same "object-cover" crop, the same
 * 700ms lift on hover, and the same cyan underline that grows from 8px to 16px
 * under the name.
 */
export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group relative bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-4/5 overflow-hidden bg-slate-50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 motion-reduce:transition-none" />
      </div>

      <div className="p-4 text-center">
        <p className="text-sm font-semibold text-slate-700 line-clamp-1 group-hover:text-cyan-600 transition-colors duration-300 motion-reduce:transition-none">
          {product.name}
        </p>
        <div className="mt-2 w-8 h-0.5 bg-cyan-500/30 mx-auto transition-all duration-500 group-hover:w-16 group-hover:bg-cyan-500 motion-reduce:transition-none" />
      </div>
    </article>
  );
}
