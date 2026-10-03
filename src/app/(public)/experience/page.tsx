import type { Metadata } from "next";
import { CareerTimeline } from "@/components/portfolio/career-timeline";
import { TechnologyUniverse } from "@/components/portfolio/technology-universe";
import { SectionHeading } from "@/components/ui/primitives";
import { listAwards, listExperience, listSkills } from "@/lib/repositories/portfolio";
import { formatRange, lines } from "@/lib/utils";

export const metadata: Metadata = { title: "Experience", description: "Career timeline, research roles, leadership and the technology I work with.", alternates: { canonical: "/experience/" } };

export default function ExperiencePage() {
  const experience = listExperience();
  const skills = listSkills();
  const awards = listAwards();
  return (
    <div className="pt-32 md:pt-44">
      <header className="container-page max-w-4xl">
        <p className="eyebrow">Experience</p>
        <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-6xl">Research labs, startups, classrooms and hackathons.</h1>
      </header>
      <section className="container-page mt-20">
        <CareerTimeline
          entries={experience.map((e) => ({
            id: e.id,
            role: e.role,
            organization: e.organization,
            location: e.location,
            type: e.type,
            period: e.period ?? formatRange(e.startDate, e.endDate, e.current),
            summary: e.summary,
            highlights: lines(e.highlights),
            skills: e.skills.map((s) => s.name),
          }))}
        />
      </section>
      {awards.length ? (
        <section className="container-page mt-16">
          <p className="eyebrow mb-5">Recognition</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {awards.map((a) => (
              <li key={a.id} className="rounded-xl border border-line p-4">
                <p className="text-sm text-fg">{a.title}</p>
                <p className="mt-1 text-xs text-muted">{a.issuer}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section id="universe" className="container-page mt-32 scroll-mt-24">
        <SectionHeading index="T" label="Technology universe" title="The tools, and what I actually use them for." description="Bubble size reflects how much real work uses a tool. Hover for details; filter by category." />
        <div className="mt-12">
          <TechnologyUniverse
            skills={skills.map((s) => ({ id: s.id, name: s.name, category: s.category, usedFor: s.usedFor, proficiency: s.proficiency, projects: s.projects, research: s.research, experiences: s._count.experiences }))}
          />
        </div>
      </section>
    </div>
  );
}
