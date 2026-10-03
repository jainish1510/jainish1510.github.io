import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectExplorer } from "@/components/portfolio/project-explorer";
import { listProjects } from "@/lib/repositories/portfolio";

export const metadata: Metadata = {
  title: "Projects",
  description: "Machine learning, research, web, cloud and AI systems projects by Jainish Patel.",
  alternates: { canonical: "/projects/" },
};

export default function ProjectsPage() {
  const projects = listProjects();
  return (
    <div className="container-page pt-32 md:pt-44">
      <header className="grid gap-8 pb-14 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="eyebrow">Projects · {projects.length}</p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-fg sm:text-6xl">Things I&apos;ve built, broken and rebuilt.</h1>
        </div>
        <p className="text-sm leading-relaxed text-muted md:text-right">
          Each project has a problem it was trying to solve, an architecture, and lessons. Entries marked <span className="text-warm">“details pending”</span> are still being written up.
        </p>
      </header>
      <Suspense fallback={<div className="skeleton h-96 w-full" />}>
        <ProjectExplorer projects={projects} />
      </Suspense>
    </div>
  );
}
