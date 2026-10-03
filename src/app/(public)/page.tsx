import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FeaturedPost, PostRow } from "@/components/blog/post-items";
import { Hero } from "@/components/home/hero";
import { NowIcon } from "@/components/home/now-icon";
import { Reveal } from "@/components/interaction/reveal";
import { ProjectCard } from "@/components/portfolio/project-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge, LiveDot, SectionHeading } from "@/components/ui/primitives";
import { LocalClock } from "@/components/widgets/local-clock";
import { listPublishedPosts, getFeaturedPost } from "@/lib/repositories/posts";
import { listProjects, listResearch } from "@/lib/repositories/portfolio";
import { listInterests, listLearning, listNowItems } from "@/lib/repositories/personal";
import { getSite } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const site = getSite();
  const now = listNowItems();
  const featured = getFeaturedPost();
  const recent = listPublishedPosts({ take: 4 });
  const projects = listProjects({ featured: true });
  const research = listResearch();
  const interests = listInterests();
  const learning = listLearning();
  const latestPost = recent.posts[0];
  const latestProject = projects[0];
  const otherPosts = recent.posts.filter((p) => p.id !== featured?.id).slice(0, 3);

  return (
    <>
      <Hero
        name={site.name}
        discipline={site.discipline}
        roles={site.roles}
        intro={site.heroIntro}
        location={site.location}
      />

      {/* ── Currently ─────────────────────────────────────────── */}
      {site.homeSections.now ? (
        <section id="now" className="container-page scroll-mt-24 py-24 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal className="space-y-6">
              <p className="eyebrow flex items-center gap-3">
                <span className="text-subtle">01</span>
                <span className="h-px w-6 bg-line-strong" />
                Currently
              </p>
              <h2 className="text-balance text-3xl font-medium tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.1]">What I&apos;m doing right now.</h2>
              <LocalClock timezone={site.timezone} label={site.location} />
            </Reveal>
            <Reveal delay={0.1}>
              <dl className="divide-y divide-line border-y border-line">
                {now.map((item) => (
                  <div key={item.id} className="grid grid-cols-[2rem_7rem_1fr] items-baseline gap-3 py-4 sm:grid-cols-[2rem_9rem_1fr]">
                    <NowIcon name={item.icon} className="size-4 translate-y-0.5 text-muted" />
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">{item.label}</dt>
                    <dd className="text-[0.9375rem] text-fg">
                      {item.value}
                      {item.detail ? <span className="block text-sm text-muted">{item.detail}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {latestPost ? (
                  <Link href={`/blog/${latestPost.slug}`} className="group rounded-xl border border-line p-4 transition hover:border-line-strong hover:bg-surface">
                    <p className="eyebrow flex items-center gap-2">
                      <LiveDot tone="accent" /> Latest article · {formatDate(latestPost.publishedAt, "short")}
                    </p>
                    <p className="mt-2 text-sm text-fg group-hover:text-accent-strong">{latestPost.title}</p>
                  </Link>
                ) : null}
                {latestProject ? (
                  <Link href={`/projects/${latestProject.slug}`} className="group rounded-xl border border-line p-4 transition hover:border-line-strong hover:bg-surface">
                    <p className="eyebrow flex items-center gap-2">
                      <LiveDot tone="warm" /> Building
                    </p>
                    <p className="mt-2 text-sm text-fg group-hover:text-accent-strong">{latestProject.title}</p>
                  </Link>
                ) : null}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ── Projects ──────────────────────────────────────────── */}
      {site.homeSections.projects && projects.length ? (
        <section className="container-page py-24 md:py-32">
          <Reveal>
            <SectionHeading
              index="02"
              label="Selected work"
              title="Things I've built to understand something better."
              action={
                <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
                  All projects <ArrowRight />
                </Link>
              }
            />
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {projects.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 0.08}>
                <ProjectCard project={p} index={i} large={i < 2} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Research ──────────────────────────────────────────── */}
      {site.homeSections.research && research.length ? (
        <section className="relative border-y border-line bg-bg-raised py-24 md:py-32">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="container-page relative">
            <Reveal>
              <SectionHeading
                index="03"
                label="Research"
                title="Questions I keep coming back to."
                description="Medical imaging, generative models and decision-making under uncertainty — each entry is a question first and a project second."
                action={
                  <Link href="/research" className={buttonVariants({ variant: "outline" })}>
                    Enter the lab <ArrowRight />
                  </Link>
                }
              />
            </Reveal>
            <ol className="mt-14 divide-y divide-line border-y border-line">
              {research.slice(0, 4).map((r, i) => (
                <Reveal key={r.id} delay={i * 0.05}>
                  <li>
                    <Link href={`/research/${r.slug}`} className="group grid gap-3 py-6 md:grid-cols-[3rem_1fr_14rem] md:items-baseline md:gap-8">
                      <span className="font-mono text-xs text-subtle">R{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="text-lg font-medium tracking-tight text-fg transition-colors group-hover:text-accent-strong md:text-xl">{r.title}</h3>
                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">{r.question ?? r.abstract}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Badge tone={r.status === "ONGOING" ? "accent" : r.status === "PLANNED" ? "warm" : "neutral"}>{r.status.toLowerCase()}</Badge>
                        {r.areas.slice(0, 1).map((a) => (
                          <Badge key={a.slug} tone="outline">
                            {a.name}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── Writing ───────────────────────────────────────────── */}
      {site.homeSections.writing && featured ? (
        <section className="container-page py-24 md:py-32">
          <Reveal>
            <SectionHeading
              index="04"
              label="Writing"
              title="Notes, experiments and things I'm figuring out."
              action={
                <Link href="/blog" className={buttonVariants({ variant: "outline" })}>
                  The publication <ArrowRight />
                </Link>
              }
            />
          </Reveal>
          <Reveal className="mt-14">
            <FeaturedPost post={featured} />
          </Reveal>
          <div className="mt-6">
            {otherPosts.map((p) => (
              <PostRow key={p.id} post={p} showCover={false} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── About + interests ─────────────────────────────────── */}
      {site.homeSections.about ? (
        <section className="container-page py-24 md:py-32">
          <div className="grid gap-16 lg:grid-cols-2">
            <Reveal className="space-y-8">
              <SectionHeading index="05" label="About" title="A researcher who likes shipping things." />
              <p className="max-w-xl font-serif text-xl leading-relaxed text-fg-2">
                From hackathon prototypes to multicenter MRI pipelines, the thread is the same: take a messy, real problem, build the tool that makes it legible, and write down what I learned.
              </p>
              <Link href="/about" className={buttonVariants({ variant: "secondary" })}>
                The longer story <ArrowUpRight />
              </Link>
            </Reveal>
            {site.homeSections.interests ? (
              <Reveal delay={0.1} className="grid gap-10 sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-4">Currently learning</p>
                  <ul className="space-y-3">
                    {learning.map((l) => (
                      <li key={l.id} className="group">
                        <div className="flex items-baseline justify-between gap-3 text-sm text-fg">
                          <span>
                            <span className="text-accent">→</span> {l.topic}
                          </span>
                          <span className="font-mono text-[0.625rem] text-subtle">{l.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-px bg-line">
                          <div className="h-px bg-accent/70" style={{ width: `${l.progress}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow mb-4">Interests</p>
                  <ul className="space-y-3">
                    {interests.map((it) => (
                      <li key={it.id}>
                        <p className="text-sm text-fg">{it.name}</p>
                        {it.description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{it.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Contact ───────────────────────────────────────────── */}
      <section className="container-page pb-8 pt-16">
        <Reveal className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-16 text-center sm:px-12 md:py-24">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <p className="eyebrow relative">06 · Contact</p>
          <h2 className="relative mx-auto mt-6 max-w-2xl text-balance text-4xl font-medium tracking-[-0.035em] md:text-6xl">Let&apos;s build or research something together.</h2>
          {site.contactBlurb ? <p className="relative mx-auto mt-5 max-w-lg text-muted">{site.contactBlurb}</p> : null}
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Get in touch <ArrowRight />
            </Link>
            {site.email ? (
              <a href={`mailto:${site.email}`} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                {site.email}
              </a>
            ) : null}
          </div>
        </Reveal>
      </section>
    </>
  );
}
