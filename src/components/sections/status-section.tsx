import Image from "next/image";
import Container from "@/components/layout/container";

const highlights = [
  { image: "/factory.avif", text: "Factory sourcing, negotiation & order placement" },
  { image: "/qc-inspection.avif", text: "In-line + final QC inspections before shipment" },
  { image: "/sample-approval.avif", text: "Sampling, revisions & pre-production approvals" },
  { image: "/shipping.avif", text: "Production tracking, updates & shipping coordination" },
];

export default function StatusSection({ overlap }: { overlap: boolean }) {
  return (
    <section aria-label="Sourcing highlights" className={`relative z-30 ${overlap ? "-mt-24 md:-mt-28" : "pt-10 md:pt-16"}`}>
      <Container>
        <div className="rounded-2xl bg-blue-950 px-6 py-8 text-white shadow-xl md:px-10">
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {highlights.map((item) => (
              <li key={item.image} className="flex flex-col items-center gap-4 text-center">
                <Image src={item.image} alt="" width={96} height={96} sizes="(min-width: 768px) 96px, 80px" className="size-20 object-contain md:size-24" />
                <p className="max-w-[200px] text-sm leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
