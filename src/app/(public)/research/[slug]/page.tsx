import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitHubIcon } from "@/components/brand/icons";
import { Markdown } from "@/components/content/markdown";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { getResearch } from "@/lib/repositories/portfolio";
import { breadcrumbSchema, JsonLd } from "@/lib/seo";
import { formatRange } from "@/lib/utils";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getResearch((await params).slug);
  if (!r) return { title: "Research not found" };
  return { title: r.title, description: r.abstract.slice(0, 200), alternates: { canonical: `/research/${r.slug}` } };
}

const SECTIONS = [
  ["methodology", "Methodology"],
  ["datasets", "Datasets"],
  ["experiments", "Experiments"],
  ["results", "Results"],
] as const;

export default async function ResearchDetail({ params }: Props) {
  const r = await getResearch((await params).slug);
  if (!r) notFound();
  return (
    <article className="pt-28 md:pt-36">
      <JsonLd data={breadcrumbSchema([{ name: "Research", path: "/research" }, { name: r.title, path: `/research/${r.slug}` }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ResearchProject", name: r.title, description: r.abstract }} />
      <div className="container-prose">
        <Link href="/research" className="eyebrow inline-flex items-center gap-2 hover:!text-fg">
          <ArrowLeft className="size-3" /> Research
        </Link>
        <div className="mt-10 flex flex-wrap gap-2">
          <Badge tone={r.status === "ONGOING" ? "accent" : r.status === "PLANNED" ? "warm" : "neutral"}>{r.status.toLowerCase()}</Badge>
          {r.isPlaceholder ? <Badge tone="outline">placeholder · details pending</Badge> : null}
        </div>
        <h1 className="mt-6 text-balance font-serif text-4xl leading-[1.1] tracking-[-0.02em] text-fg sm:text-5xl">{r.title}</h1>
        <dl className="mt-8 grid grid-cols-2 gap-5 border-y border-line py-5 text-sm sm:grid-cols-3">
          {r.institution ? (
            <div className="col-span-2 sm:col-span-1">
              <dt className="eyebrow">Institution</dt>
              <dd className="mt-1 text-fg-2">{r.institution}</dd>
            </div>
          ) : null}
          <div>
            <dt className="eyebrow">Period</dt>
            <dd className="mt-1 text-fg-2">{formatRange(r.startDate, r.endDate, r.status === "ONGOING") || "—"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Collaborators</dt>
            <dd className="mt-1 text-fg-2">{r.collaborators ?? "—"}</dd>
          </div>
        </dl>

        <section className="mt-12">
          <h2 className="eyebrow mb-4">Abstract</h2>
          <p className="font-serif text-xl leading-relaxed text-fg">{r.abstract}</p>
        </section>
        {r.question ? (
          <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
            <h2 className="eyebrow mb-3">Research question</h2>
            <p className="font-serif text-xl italic leading-relaxed text-fg">{r.question}</p>
          </section>
        ) : null}
        {SECTIONS.filter(([k]) => r[k]).map(([k, label]) => (
          <section key={k} className="mt-12">
            <h2 className="eyebrow mb-4">{label}</h2>
            <Markdown source={r[k]!} />
          </section>
        ))}
        {r.figures.length ? (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Figures</h2>
            <div className="space-y-6">
              {r.figures.map((f, i) => (
                <figure key={f.id}>
                  <Image src={f.path} alt={f.alt} width={f.width ?? 1200} height={f.height ?? 800} className="h-auto w-full rounded-xl border border-line" sizes="(min-width: 768px) 704px, 100vw" />
                  <figcaption className="mt-2 text-sm text-muted">
                    Figure {i + 1}. {f.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
        <section className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
          <div>
            <h2 className="eyebrow mb-2">Publication</h2>
            <p className="text-sm text-fg-2">{r.publication ?? "No publication yet."}</p>
          </div>
          <div>
            <h2 className="eyebrow mb-2">Code</h2>
            {r.codeUrl ? (
              <a href={r.codeUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <GitHubIcon /> Repository
              </a>
            ) : (
              <p className="text-sm text-muted">Not public.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <h2 className="eyebrow mb-2">Areas &amp; methods</h2>
            <div className="flex flex-wrap gap-1.5">
              {[...r.areas.map((a) => a.name), ...r.skills.map((s) => s.name)].map((n) => (
                <span key={n} className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-fg-2">
                  {n}
                </span>
              ))}
            </div>
          </div>
          {r.projects.length ? (
            <div className="sm:col-span-2">
              <h2 className="eyebrow mb-2">Related projects</h2>
              {r.projects.map((p) => (
                <Link key={p.slug} href={`/projects/${p.slug}`} className="block text-sm text-fg hover:text-accent-strong">
                  → {p.title}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
