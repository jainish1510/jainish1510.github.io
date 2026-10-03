import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/content/markdown";
import { Embed } from "@/components/content/embed";
import { GitHubIcon } from "@/components/brand/icons";
import { Reveal } from "@/components/interaction/reveal";
import { Cover } from "@/components/portfolio/cover";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { createEmbed } from "@/lib/content/embeds";
import { getAdjacentProjects, getProject } from "@/lib/repositories/portfolio";
import { breadcrumbSchema, JsonLd } from "@/lib/seo";
import { formatRange } from "@/lib/utils";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary, alternates: { canonical: `/projects/${project.slug}` }, openGraph: { title: project.title, description: project.summary } };
}

const SECTIONS = [
  ["problem", "Problem"],
  ["motivation", "Why I built it"],
  ["architecture", "Architecture"],
  ["howItWorks", "How it works"],
  ["challenges", "Challenges"],
  ["results", "Results"],
  ["lessons", "Lessons"],
] as const;

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const adjacent = await getAdjacentProjects(slug);
  const video = project.videoUrl ? createEmbed(project.videoUrl, `${project.title} demo`) : null;
  const sections = SECTIONS.filter(([key]) => project[key]);

  return (
    <article className="pt-28 md:pt-36">
      <JsonLd data={breadcrumbSchema([{ name: "Projects", path: "/projects" }, { name: project.title, path: `/projects/${project.slug}` }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: project.title, description: project.summary, keywords: project.skills.map((s) => s.name).join(", ") }} />
      <div className="container-page">
        <Link href="/projects" className="eyebrow inline-flex items-center gap-2 hover:!text-fg">
          <ArrowLeft className="size-3" /> All projects
        </Link>
        <header className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{project.category}</Badge>
              <Badge tone={project.status === "ACTIVE" ? "accent" : "outline"}>{project.status.toLowerCase()}</Badge>
              {project.isPlaceholder ? <Badge tone="warm">details pending</Badge> : null}
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-fg sm:text-6xl md:text-7xl">{project.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-2">{project.summary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 text-sm lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <dt className="eyebrow">Timeline</dt>
              <dd className="mt-1 text-fg">{formatRange(project.startDate, project.endDate, project.status === "ACTIVE") || "—"}</dd>
            </div>
            <div>
              <dt className="eyebrow">Status</dt>
              <dd className="mt-1 capitalize text-fg">{project.status.toLowerCase()}</dd>
            </div>
            {project.recognition ? (
              <div className="col-span-2">
                <dt className="eyebrow">Recognition</dt>
                <dd className="mt-1 text-warm">{project.recognition}</dd>
              </div>
            ) : null}
            <div className="col-span-2">
              <dt className="eyebrow">Technology</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {project.skills.map((s) => (
                  <span key={s.id} className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-fg-2">
                    {s.name}
                  </span>
                ))}
              </dd>
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              {project.githubUrl ? (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" data-cursor="external" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  <GitHubIcon /> GitHub
                </a>
              ) : null}
              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" data-cursor="external" className={buttonVariants({ variant: "primary", size: "sm" })}>
                  Live demo <ArrowUpRight />
                </a>
              ) : null}
              {!project.githubUrl && !project.demoUrl ? <span className="text-xs text-subtle">Links will be added when available.</span> : null}
            </div>
          </dl>
        </header>
        <div className="relative mt-14 aspect-[16/8] overflow-hidden rounded-2xl border border-line">
          <Cover media={project.cover} seed={project.slug} priority sizes="(min-width: 1216px) 1152px, 100vw" className="absolute inset-0" />
        </div>
      </div>

      <div className="container-page mt-20 grid gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="sticky top-28 space-y-2 text-sm">
            {sections.map(([key, label], i) => (
              <li key={key}>
                <a href={`#${key}`} className="flex gap-3 text-muted transition hover:text-fg">
                  <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-3xl space-y-20">
          {sections.map(([key, label], i) => (
            <Reveal key={key}>
              <section id={key} className="scroll-mt-28">
                <p className="eyebrow mb-5 flex items-center gap-3">
                  <span className="text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px w-6 bg-line-strong" />
                  {label}
                </p>
                <Markdown source={project[key]!} />
              </section>
            </Reveal>
          ))}
          {project.gallery.length ? (
            <section id="gallery" className="scroll-mt-28">
              <p className="eyebrow mb-5">Gallery</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.gallery.map((m) => (
                  <figure key={m.id} className="overflow-hidden rounded-xl border border-line">
                    <Image src={m.path} alt={m.alt} width={m.width ?? 1200} height={m.height ?? 800} sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
                    {m.caption ? <figcaption className="px-3 py-2 text-xs text-muted">{m.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}
          {video ? (
            <section id="demo">
              <p className="eyebrow mb-5">Demo</p>
              <Embed provider={video.provider} src={video.src} title={video.title} poster={video.thumbnail} />
            </section>
          ) : null}
          {project.research.length ? (
            <section>
              <p className="eyebrow mb-4">Related research</p>
              {project.research.map((r) => (
                <Link key={r.slug} href={`/research/${r.slug}`} className="flex items-center justify-between border-t border-line py-4 text-fg hover:text-accent-strong">
                  {r.title} <ArrowRight className="size-4" />
                </Link>
              ))}
            </section>
          ) : null}
        </div>
      </div>

      <nav aria-label="More projects" className="container-page mt-24 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {adjacent.previous ? (
          <Link href={`/projects/${adjacent.previous.slug}`} className="group">
            <p className="eyebrow">← Previous</p>
            <p className="mt-2 text-xl tracking-tight text-fg group-hover:text-accent-strong">{adjacent.previous.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link href={`/projects/${adjacent.next.slug}`} className="group text-right">
            <p className="eyebrow">Next →</p>
            <p className="mt-2 text-xl tracking-tight text-fg group-hover:text-accent-strong">{adjacent.next.title}</p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
