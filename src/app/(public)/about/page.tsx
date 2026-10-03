import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Markdown } from "@/components/content/markdown";
import { Reveal } from "@/components/interaction/reveal";
import { Journey } from "@/components/portfolio/journey";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { GitHubWidget } from "@/components/widgets/github-widget";
import { LocalClock } from "@/components/widgets/local-clock";
import { RandomFact } from "@/components/widgets/random-fact";
import { SpotifyWidget } from "@/components/widgets/spotify-widget";
import { ToolsOrbit } from "@/components/widgets/tools-orbit";
import { listAwards, listEducation, listExperience, listSkills } from "@/lib/repositories/portfolio";
import { getWidgets, listBooks, listFacts, listGoals, listInterests, listLearning, listTimeline } from "@/lib/repositories/personal";
import { getSite } from "@/lib/site";
import { formatDate, formatRange, lines } from "@/lib/utils";

export const metadata: Metadata = { title: "About", description: "The longer story — education, research, work, and what I'm learning now.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  const site = getSite();
  const timeline = listTimeline();
  const education = listEducation();
  const experience = listExperience();
  const awards = listAwards();
  const skills = listSkills();
  const learning = listLearning();
  const facts = listFacts();
  const books = listBooks();
  const interests = listInterests();
  const goals = listGoals();
  const widgets = getWidgets();
  const portrait = site.portrait;
  const favorites = skills.filter((s) => s.favorite).map((s) => ({ name: s.name, usedFor: s.usedFor, projects: s._count.projects }));
  const researchInterests = [...new Set(skills.filter((s) => s.category === "RESEARCH").map((s) => s.name))];

  return (
    <div className="pt-32 md:pt-44">
      {/* Introduction */}
      <header className="container-page grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="eyebrow">About</p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            Hi, I&apos;m {site.name.split(" ")[0]}.
            <span className="block text-muted">I learn by building.</span>
          </h1>
          {site.aboutIntro ? <Markdown source={site.aboutIntro} className="mt-10 max-w-2xl text-[1.3rem] leading-relaxed [&_p]:text-fg-2" /> : null}
        </div>
        <div className="space-y-4">
          {portrait ? (
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-line">
              <Image src={portrait.src} alt={portrait.alt} fill sizes="352px" className="object-cover" priority />
              {portrait.isPlaceholder ? (
                <Badge tone="outline" className="absolute bottom-3 left-3 bg-bg/70 backdrop-blur">
                  placeholder · replace with your photo
                </Badge>
              ) : null}
            </div>
          ) : null}
          {widgets.clock.enabled ? <LocalClock timezone={site.timezone} label={site.location} /> : null}
        </div>
      </header>

      {/* Story */}
      {site.aboutStory ? (
        <section className="container-page mt-28 grid gap-12 lg:grid-cols-[14rem_1fr]">
          <p className="eyebrow lg:pt-2">The story so far</p>
          <Reveal>
            <Markdown source={site.aboutStory} className="max-w-2xl" />
          </Reveal>
        </section>
      ) : null}

      {/* Widgets */}
      <section className="container-page mt-28" aria-label="Right now">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.spotify?.enabled ? <SpotifyWidget track={widgets.spotify} /> : null}
          {widgets.randomFact.enabled ? <RandomFact facts={facts.map((f) => f.text)} /> : null}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="eyebrow">Currently learning</p>
            <ul className="mt-4 space-y-3.5">
              {learning.map((l) => (
                <li key={l.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-fg">
                      <span className="text-accent">→</span> {l.topic}
                    </span>
                    <span className="font-mono text-[0.625rem] text-subtle">{l.progress}%</span>
                  </div>
                  {l.note ? <p className="text-xs text-muted">{l.note}</p> : null}
                  <div className="mt-1.5 h-px bg-line">
                    <div className="h-px bg-accent" style={{ width: `${l.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {widgets.github.enabled && widgets.github.username ? (
            <div className="md:col-span-2">
              <GitHubWidget username={widgets.github.username} />
            </div>
          ) : null}
          {favorites.length ? <ToolsOrbit tools={favorites} /> : null}
        </div>
      </section>

      {/* Journey */}
      <section className="container-page mt-32">
        <SectionHeading index="01" label="Journey" title="How I got here." description="Click any milestone to expand it." />
        <div className="mt-14">
          <Journey events={timeline.map((t) => ({ id: t.id, year: t.year, title: t.title, description: t.description, kind: t.kind, link: t.link }))} />
        </div>
      </section>

      {/* Education + experience, editorial two-column */}
      <section className="container-page mt-24 grid gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading index="02" label="Education" title="Where I studied." />
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {education.map((e) => (
              <li key={e.id} className="py-6">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle">
                  {e.expected ? `Expected ${formatDate(e.endDate, "month")}` : formatDate(e.endDate, "month")}
                </p>
                <p className="mt-2 text-lg tracking-tight text-fg">
                  {e.degree} {e.field}
                </p>
                <p className="text-sm text-muted">
                  {e.institution}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {lines(e.notes).length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lines(e.notes).map((n) => (
                      <Badge key={n}>{n}</Badge>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading index="03" label="Work & research" title="Where I've worked." />
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {experience.map((x) => (
              <li key={x.id} className="py-6">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-subtle">
                  {x.period ?? formatRange(x.startDate, x.endDate, x.current)} · {x.type.toLowerCase()}
                </p>
                <p className="mt-2 text-lg tracking-tight text-fg">{x.role}</p>
                <p className="text-sm text-muted">{x.organization}</p>
              </li>
            ))}
          </ul>
          <Link href="/experience" className="mt-5 inline-flex items-center gap-1.5 text-sm text-fg link-underline">
            Full career timeline <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Recognition, interests, goals, books */}
      <section className="container-page mt-28 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="eyebrow mb-5">Recognition</p>
          <ul className="space-y-4">
            {awards.map((a) => (
              <li key={a.id}>
                <p className="text-sm text-fg">{a.title}</p>
                <p className="text-xs text-muted">
                  {a.issuer}
                  {a.description ? ` — ${a.description}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5">Research interests</p>
          <ul className="space-y-2 text-sm text-fg-2">
            {["Machine Learning", "Medical Imaging", "Pattern Recognition", "Data Mining", "Generative Models", "AI Systems", ...researchInterests].filter((v, i, a) => a.indexOf(v) === i).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5">Interests &amp; hobbies</p>
          <ul className="space-y-3">
            {interests.map((i) => (
              <li key={i.id}>
                <p className="text-sm text-fg">{i.name}</p>
                {i.description ? <p className="text-xs leading-relaxed text-muted">{i.description}</p> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-10">
          <div>
            <p className="eyebrow mb-5">Current goals</p>
            <ul className="space-y-3">
              {goals.map((g) => (
                <li key={g.id} className="flex gap-3 text-sm text-fg-2">
                  <span className="font-mono text-[0.625rem] text-subtle">{g.horizon}</span>
                  {g.text}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5">Bookshelf</p>
            {books.length ? (
              <ul className="space-y-3">
                {books.map((b) => (
                  <li key={b.id}>
                    <p className="font-serif italic text-fg">{b.title}</p>
                    <p className="text-xs text-muted">
                      {b.author} · {b.status.toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-subtle">Reading list coming soon.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
