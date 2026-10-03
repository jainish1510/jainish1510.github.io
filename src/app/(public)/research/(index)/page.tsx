import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/interaction/reveal";
import { ResearchGraph } from "@/components/research/research-graph";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { getResearchGraph, listResearch } from "@/lib/repositories/portfolio";
import { formatRange } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Research",
  description: "Research on medical imaging, generative models, NLP and decision-making under uncertainty.",
  alternates: { canonical: "/research" },
};

const STATUS_TONE = { ONGOING: "accent", COMPLETED: "neutral", PLANNED: "warm" } as const;

export default async function ResearchPage() {
  const [research, graph] = await Promise.all([listResearch(), getResearchGraph()]);
  return (
    <div className="pt-32 md:pt-44">
      <header className="container-page grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div>
          <p className="eyebrow">The lab</p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-6xl">Questions first. Projects second.</h1>
        </div>
        <p className="font-serif text-lg leading-relaxed text-muted">
          Each entry starts from a research question, then records how I approached it, what data was involved, and what came out. Publications are only listed when they exist.
        </p>
      </header>

      <section className="container-page mt-20" aria-labelledby="map-heading">
        <h2 id="map-heading" className="eyebrow mb-5">
          Map of interests
        </h2>
        <ResearchGraph data={graph} />
      </section>

      <section className="container-page mt-28">
        <SectionHeading index="R" label="Entries" title="Research log" />
        <div className="mt-12 space-y-4">
          {research.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.04}>
              <Link href={`/research/${r.slug}`} className="group grid gap-6 rounded-2xl border border-line bg-surface p-6 transition hover:border-line-strong md:grid-cols-[1fr_16rem] md:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? "neutral"}>{r.status.toLowerCase()}</Badge>
                    {r.isPlaceholder ? <Badge tone="outline">in progress · placeholder</Badge> : null}
                  </div>
                  <h3 className="mt-4 font-serif text-2xl leading-snug text-fg transition-colors group-hover:text-accent-strong md:text-[1.75rem]">{r.title}</h3>
                  {r.question ? (
                    <p className="mt-3 border-l border-accent/50 pl-4 font-serif italic text-fg-2">{r.question}</p>
                  ) : null}
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{r.abstract}</p>
                </div>
                <dl className="space-y-3 text-xs md:border-l md:border-line md:pl-6">
                  {r.institution ? (
                    <div>
                      <dt className="eyebrow">Institution</dt>
                      <dd className="mt-1 text-fg-2">{r.institution}</dd>
                    </div>
                  ) : null}
                  {r.startDate ? (
                    <div>
                      <dt className="eyebrow">Period</dt>
                      <dd className="mt-1 text-fg-2">{formatRange(r.startDate, r.endDate, r.status === "ONGOING")}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="eyebrow">Areas</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1">
                      {r.areas.map((a) => (
                        <span key={a.slug} className="rounded border border-line px-1.5 py-0.5 text-fg-2">
                          {a.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
