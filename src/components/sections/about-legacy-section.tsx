import Image from "next/image";
import Container from "@/components/layout/container";

/**
 * "A Legacy of Excellence Since 2007": the founding story.
 *
 * The reference pulled this copy from its own `/api/established-excellence`
 * endpoint. It is reproduced verbatim here because the About page is static,
 * so the paragraph array below is the single source of truth. The only change
 * is presentation: the two dates the reference buried in the heading and the
 * subtitle are pulled out as milestone cards, so the timeline reads at a
 * glance instead of having to be parsed out of the prose.
 */

type Milestone = {
  id: string;
  year: string;
  label: string;
};

const MILESTONES: Milestone[] = [
  { id: "manufacturing-roots", year: "2007", label: "Manufacturing roots" },
  { id: "sourcing-house", year: "2010", label: "Sourcing house established" },
];

const STORY = {
  title: "A Legacy of Excellence Since 2007",
  subtitle:
    "Manufacturing Roots, Global Sourcing Expertise Established in 2010",
  /**
   * The decorative framed artwork the reference sets beside this story. It is
   * 3:2, so it is sized explicitly and never cropped.
   */
  image: "/cta-img.svg",
  imageWidth: 1440,
  imageHeight: 960,
  paragraphs: [
    "Founded with a vision to transform the apparel industry, Alliance Sourcing BD has evolved into a trusted global partner in garment sourcing. Our roots go back to 2007, when our manufacturing journey began, laying a strong foundation in quality production. Building on that experience, we established our sourcing house in 2010 to connect global brands with reliable and high-quality manufacturing solutions.",
    "With decades of combined expertise, we bridge the gap between international buyers and top-tier factories in Bangladesh and beyond. Our strength lies in deep industry knowledge, strong supplier networks, and a commitment to transparency and efficiency.",
    "Our journey reflects a continuous pursuit of excellence, ethical sourcing practices, and adaptability to the ever-changing fashion landscape. What started as a small initiative has grown into a dynamic organization working with numerous global brands and manufacturers.",
    "Today, we proudly ensure that every partnership we build is rooted in quality, compliance, sustainability, and long-term mutual growth.",
  ],
};

export default function AboutLegacySection() {
  return (
    <section
      aria-labelledby="about-legacy-heading"
      className="bg-white py-14 md:py-20"
    >
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2
              id="about-legacy-heading"
              className="font-heading text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl"
            >
              {STORY.title}
            </h2>

            <h3 className="font-heading mt-4 text-lg leading-snug font-semibold text-slate-700 sm:text-xl">
              {STORY.subtitle}
            </h3>

            {STORY.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-base leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MILESTONES.map((milestone) => (
                <li
                  key={milestone.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_0_10px_rgba(0,0,0,0.08)]"
                >
                  <p className="font-heading text-3xl leading-none font-bold text-cyan-600">
                    {milestone.year}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {milestone.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative framing artwork, so it carries no information. */}
          <Image
            src={STORY.image}
            alt=""
            width={STORY.imageWidth}
            height={STORY.imageHeight}
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="h-auto w-full"
          />
        </div>
      </Container>
    </section>
  );
}
