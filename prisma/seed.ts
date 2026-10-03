/**
 * Development seed.
 *
 *   npm run db:seed            → content + demo engagement data
 *   npm run db:seed -- --no-demo  → content only (no demo comments/likes/views)
 *
 * Sources: profile facts (education, experience, projects, recognitions) come
 * from the CV data that lived in this repository before the rebuild. Anything
 * not in that source is marked `isPlaceholder`, labelled "[Placeholder]", or
 * flagged `isDemo` so it renders with a visible "demo" marker.
 *
 * Refuses to run when NODE_ENV=production unless --force is passed.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/lib/db/client";
import { hashPassword } from "../src/lib/auth/password";
import { makeExcerpt, readingTime, slugify } from "../src/lib/content/text";
import { barsSvg, coverSvg, latentGridSvg } from "./seed-art";

const args = new Set(process.argv.slice(2));
const withDemo = !args.has("--no-demo");

if (process.env.NODE_ENV === "production" && !args.has("--force")) {
  console.error("Refusing to seed a production database. Pass --force if you really mean it.");
  process.exit(1);
}

const UPLOADS = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "data/uploads");
const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

async function png(svg: string, folder: string, filename: string, alt: string, caption?: string) {
  const dir = path.join(UPLOADS, folder.toLowerCase());
  await mkdir(dir, { recursive: true });
  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(dir, filename), buffer);
  const meta = await sharp(buffer).metadata();
  return db.media.create({
    data: {
      filename,
      originalName: filename,
      path: `/media/${folder.toLowerCase()}/${filename}`,
      mimeType: "image/png",
      size: buffer.byteLength,
      width: meta.width ?? null,
      height: meta.height ?? null,
      alt,
      caption: caption ?? null,
      folder,
    },
  });
}

async function wipe() {
  // Order matters for foreign keys.
  await db.commentLike.deleteMany();
  await db.comment.deleteMany();
  await db.like.deleteMany();
  await db.bookmark.deleteMany();
  await db.view.deleteMany();
  await db.event.deleteMany();
  await db.postRevision.deleteMany();
  await db.post.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();
  await db.award.deleteMany();
  await db.project.deleteMany();
  await db.researchProject.deleteMany();
  await db.experience.deleteMany();
  await db.education.deleteMany();
  await db.skill.deleteMany();
  await db.researchArea.deleteMany();
  await db.media.deleteMany();
  await db.socialLink.deleteMany();
  await db.nowItem.deleteMany();
  await db.timelineEvent.deleteMany();
  await db.learningItem.deleteMany();
  await db.fact.deleteMany();
  await db.book.deleteMany();
  await db.interest.deleteMany();
  await db.goal.deleteMany();
  await db.personalWidget.deleteMany();
  await db.siteSetting.deleteMany();
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Jainish Patel";
  let password = process.env.ADMIN_PASSWORD?.trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (password && password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (!password && existing) return existing; // keep the current password
  let generated = false;
  if (!password) {
    password = randomBytes(12).toString("base64url");
    generated = true;
  }
  const passwordHash = await hashPassword(password);
  const user = await db.user.upsert({ where: { email }, create: { email, name, passwordHash }, update: { name, passwordHash } });
  if (generated) {
    console.log("\n  ┌──────────────────────────────────────────────────────────┐");
    console.log(`  │ Admin account created: ${email.padEnd(34)}│`);
    console.log(`  │ Generated password:    ${password.padEnd(34)}│`);
    console.log("  │ Shown once. Set ADMIN_PASSWORD in .env to choose your own. │");
    console.log("  └──────────────────────────────────────────────────────────┘\n");
  }
  return user;
}

async function main() {
  console.log(`Seeding ${process.env.DATABASE_URL ?? "file:./data/portfolio.db"} ${withDemo ? "(with demo engagement)" : "(content only)"}`);
  await wipe();
  const admin = await seedAdmin();

  // ─── Settings ──────────────────────────────────────────────────────────
  const settings: Record<string, string> = {
    "about.intro":
      "I'm Jainish — a computer science graduate student at **Vanderbilt University**, working where machine learning meets real, messy data. Most of what I do sits between three things: research questions I can't stop thinking about, software that has to actually run, and the craft of explaining both clearly.",
    "about.story":
      "I studied computer science at **Middle Tennessee State University**, where I served as vice president of the ACM chapter and spent a lot of weekends at hackathons. Along the way I fine-tuned transformer models for legislative summarisation, built retrieval-augmented assistants for a health startup, and spent a summer building MRI analysis pipelines at the Vanderbilt Institute for Surgery and Engineering.\n\nThat summer changed how I think about machine learning. The hard problems were rarely the model — they were the data: where it came from, what it silently assumed, and whether anyone could reproduce the result six months later. This site is where I document that kind of thinking: experiments, notes, and the things I build to understand something better.",
    "contact.email": "jainish.h.patel@vanderbilt.edu",
    "contact.blurb": "Research collaborations, interesting engineering problems, or just a good conversation about machine learning — my inbox is open.",
    "contact.availability": "[Placeholder] Open to research collaborations and internships — edit in /admin/settings",
  };
  for (const [key, value] of Object.entries(settings)) await db.siteSetting.create({ data: { key, value } });

  // ─── Taxonomy ──────────────────────────────────────────────────────────
  const categories = Object.fromEntries(
    await Promise.all(
      [
        { name: "Research Notes", description: "Working notes from research and study." },
        { name: "Building", description: "Engineering write-ups and lessons from shipping things." },
        { name: "Essays", description: "Longer thinking on ideas I keep returning to." },
      ].map(async (c, i) => [c.name, await db.category.create({ data: { ...c, slug: slugify(c.name), order: i } })] as const),
    ),
  );

  // ─── Research areas (graph nodes) ──────────────────────────────────────
  const areaDefs: { name: string; parent?: string; description: string }[] = [
    { name: "Machine Learning", description: "Learning from data — the thread through everything else." },
    { name: "Medical Imaging", parent: "Machine Learning", description: "MRI analysis, harmonisation and reproducible pipelines." },
    { name: "Generative Models", parent: "Machine Learning", description: "VAEs, latent spaces and the quality–smoothness trade-off." },
    { name: "Computer Vision", parent: "Machine Learning", description: "Understanding images and volumes." },
    { name: "Natural Language Processing", parent: "Machine Learning", description: "Summarisation, retrieval and language models." },
    { name: "Data Mining", description: "Finding structure in large, noisy datasets." },
    { name: "Pattern Recognition", parent: "Data Mining", description: "Classical and statistical approaches to structure." },
    { name: "Uncertainty", parent: "Data Mining", description: "Decision-making when you don't know enough." },
    { name: "AI Systems", description: "Agents, tools and the software around models." },
    { name: "Cloud & Systems", description: "Infrastructure that makes ML actually run." },
    { name: "Quantum Information", description: "Quantum computing and cryptography experiments." },
  ];
  const areas: Record<string, { id: string }> = {};
  for (const [i, a] of areaDefs.entries()) {
    areas[a.name] = await db.researchArea.create({
      data: { name: a.name, slug: slugify(a.name), description: a.description, order: i, parentId: a.parent ? areas[a.parent]!.id : null },
    });
  }
  const area = (...names: string[]) => names.map((n) => ({ id: areas[n]!.id }));

  // ─── Skills (from the CV skills list) ──────────────────────────────────
  const skillDefs: { name: string; category: string; usedFor?: string; areas?: string[]; favorite?: boolean; proficiency?: number }[] = [
    { name: "Python", category: "LANGUAGES", usedFor: "ML research\nData analysis\nBackend systems", areas: ["Machine Learning", "Data Mining"], favorite: true, proficiency: 5 },
    { name: "TypeScript", category: "LANGUAGES", usedFor: "Web applications\nInteractive visualizations", favorite: true, proficiency: 4 },
    { name: "C++", category: "LANGUAGES", usedFor: "Algorithms\nSystems coursework", proficiency: 3 },
    { name: "SQL", category: "LANGUAGES", usedFor: "Analytics\nApplication data", proficiency: 4 },
    { name: "R", category: "LANGUAGES", usedFor: "Statistical analysis", proficiency: 3 },
    { name: "PyTorch", category: "ML", usedFor: "Model training\nResearch prototypes", areas: ["Machine Learning", "Generative Models"], favorite: true, proficiency: 4 },
    { name: "TensorFlow", category: "ML", usedFor: "Model training", areas: ["Machine Learning"], proficiency: 3 },
    { name: "scikit-learn", category: "ML", usedFor: "Classical ML\nStatistical modelling", areas: ["Pattern Recognition", "Data Mining", "Medical Imaging"], proficiency: 4 },
    { name: "Hugging Face", category: "ML", usedFor: "Transformer fine-tuning", areas: ["Natural Language Processing"], proficiency: 4 },
    { name: "LangChain", category: "ML", usedFor: "Retrieval-augmented generation", areas: ["AI Systems"], proficiency: 3 },
    { name: "LlamaIndex", category: "ML", usedFor: "Retrieval pipelines", areas: ["AI Systems"], proficiency: 3 },
    { name: "Next.js", category: "FRAMEWORKS", usedFor: "Full-stack web apps\nThis site", favorite: true, proficiency: 4 },
    { name: "FastAPI", category: "FRAMEWORKS", usedFor: "ML model APIs", areas: ["AI Systems"], proficiency: 4 },
    { name: "Node.js", category: "FRAMEWORKS", usedFor: "Backend services", proficiency: 3 },
    { name: "AWS", category: "CLOUD", usedFor: "Deployment\nQuantum (Braket)", areas: ["Cloud & Systems", "Quantum Information"], proficiency: 3 },
    { name: "Amazon Braket", category: "CLOUD", usedFor: "Quantum circuit simulation", areas: ["Quantum Information"], proficiency: 2 },
    { name: "Docker", category: "INFRASTRUCTURE", usedFor: "Reproducible environments", areas: ["Cloud & Systems"], favorite: true, proficiency: 4 },
    { name: "Git", category: "TOOLS", usedFor: "Everything", favorite: true, proficiency: 5 },
    { name: "Tableau", category: "TOOLS", usedFor: "Dashboards", proficiency: 3 },
    { name: "Power BI", category: "TOOLS", usedFor: "Reporting", proficiency: 3 },
    { name: "MongoDB", category: "DATABASES", usedFor: "Vector search\nDocument storage", areas: ["AI Systems"], proficiency: 3 },
    { name: "PostgreSQL", category: "DATABASES", usedFor: "Relational data", proficiency: 3 },
    { name: "SQLite", category: "DATABASES", usedFor: "Local-first apps\nThis site", proficiency: 4 },
    { name: "MRI analysis", category: "RESEARCH", usedFor: "Brain volume pipelines", areas: ["Medical Imaging"], proficiency: 3 },
    { name: "Statistical modelling", category: "RESEARCH", usedFor: "Harmonisation\nExperiment analysis", areas: ["Medical Imaging", "Uncertainty"], proficiency: 3 },
    { name: "Three.js", category: "FRAMEWORKS", usedFor: "WebGL visualization", proficiency: 3 },
  ];
  const skills: Record<string, { id: string }> = {};
  for (const [i, s] of skillDefs.entries()) {
    skills[s.name] = await db.skill.create({
      data: {
        name: s.name,
        slug: slugify(s.name),
        category: s.category,
        usedFor: s.usedFor,
        favorite: s.favorite ?? false,
        proficiency: s.proficiency ?? 3,
        order: i,
        areas: { connect: area(...(s.areas ?? [])) },
      },
    });
  }
  const skill = (...names: string[]) => names.map((n) => ({ id: skills[n]!.id }));

  // ─── Media ─────────────────────────────────────────────────────────────
  const cover = (slug: string, hue: number, folder = "BLOG") => png(coverSvg(slug, hue), folder, `${slug}-cover.png`, "Generative cover artwork");
  await png(latentGridSvg(), "BLOG", "vae-latent-grid.png", "Placeholder figure of a latent space traversal grid", "Placeholder figure");
  await png(barsSvg(false), "BLOG", "viz-before.png", "Placeholder figure: unsorted bars");
  await png(barsSvg(true), "BLOG", "viz-after.png", "Placeholder figure: sorted bars");
  await png(coverSvg("profile", 200, 1200, 1200), "PROFILE", "profile-pattern.png", "Abstract pattern used as a profile placeholder");

  // ─── Projects ──────────────────────────────────────────────────────────
  const projects: {
    title: string;
    summary: string;
    category: string;
    status: string;
    start?: string;
    end?: string;
    hue: number;
    featured?: boolean;
    placeholder?: boolean;
    recognition?: string;
    skills: string[];
    areas: string[];
    githubUrl?: string;
    sections: Partial<Record<"problem" | "motivation" | "architecture" | "howItWorks" | "challenges" | "results" | "lessons", string>>;
  }[] = [
    {
      title: "Multi-Cloud Deployment Orchestrator",
      summary: "A declarative orchestrator that plans and reconciles service deployments across AWS, GCP and Azure behind a single provider interface.",
      category: "CLOUD",
      status: "ACTIVE",
      hue: 205,
      featured: true,
      placeholder: true,
      skills: ["Python", "Docker", "AWS", "TypeScript"],
      areas: ["Cloud & Systems"],
      sections: {
        problem: "Cloud SDKs assume you will only ever use one provider. Deploying the same service to several clouds means re-learning IAM, naming rules and failure modes for each.",
        motivation: "I wanted to understand infrastructure as a *control loop* — desired state, observed state, and the smallest set of actions that closes the gap.",
        architecture:
          "```mermaid\nflowchart LR\n  spec[Service spec] --> planner[Planner]\n  planner --> reconciler[Reconciler]\n  reconciler --> aws[AWS adapter]\n  reconciler --> gcp[GCP adapter]\n  reconciler --> az[Azure adapter]\n```\n\nEach provider implements the same `ProviderAdapter` interface: `observe`, `apply` and `estimate`.",
        howItWorks: "The planner scores candidate placements on cost, latency and redundancy. The reconciler repeatedly diffs desired and observed state and applies idempotent actions with retries.",
        challenges: "- Eventual consistency in provider list APIs\n- Partial failures mid-rollout\n- Provider-specific naming constraints",
        results: "[Placeholder] Add measured deployment times, supported services and test coverage.",
        lessons: "Make every action idempotent and retries become free. Put provider differences behind an interface before the second provider, not after the third.",
      },
    },
    {
      title: "VAE Benchmark",
      summary: "A controlled benchmark of variational autoencoder variants exploring the trade-off between reconstruction quality and latent-space smoothness.",
      category: "ML",
      status: "ACTIVE",
      hue: 265,
      featured: true,
      placeholder: true,
      skills: ["Python", "PyTorch"],
      areas: ["Generative Models", "Machine Learning"],
      sections: {
        problem: "VAE papers report results under different architectures, datasets and training budgets, which makes the effect of each design choice hard to isolate.",
        motivation: "Understand *why* reconstruction quality and latent smoothness pull against each other, by changing one variable at a time.",
        howItWorks: "A shared training harness runs each variant (β-VAE and others) with identical encoders, data splits and seeds, logging reconstruction error, KL and latent-traversal metrics.",
        results: "[Placeholder] Add benchmark tables and figures once experiments are complete.",
        lessons: "[Placeholder]",
      },
    },
    {
      title: "AI Elder Care System",
      summary: "Led a 4-member team building an AI elder-care system with Next.js, FastAPI, GPT and Twilio, achieving a 95% task automation rate.",
      category: "AI",
      status: "COMPLETED",
      hue: 165,
      featured: true,
      recognition: "HackMT '25 — Hacker's Choice Award",
      skills: ["Next.js", "FastAPI", "Python", "TypeScript"],
      areas: ["AI Systems"],
      sections: {
        problem: "Caring for older family members involves a long tail of small, repetitive coordination tasks — reminders, check-ins and follow-ups.",
        howItWorks: "A Next.js front end and FastAPI back end orchestrate GPT-driven conversations, with Twilio handling phone and SMS touchpoints.",
        results: "95% task automation rate in the hackathon demo; HackMT '25 Hacker's Choice Award.",
        lessons: "[Placeholder] Add what you learned leading the team under hackathon time pressure.",
      },
    },
    {
      title: "BlueAid",
      summary: "An LLM-based medical bill analysis tool deployed on AWS that identified 80% of overbilling cases.",
      category: "AI",
      status: "COMPLETED",
      hue: 215,
      featured: true,
      recognition: "HackMT '24 — Winner",
      skills: ["Python", "AWS"],
      areas: ["AI Systems", "Natural Language Processing"],
      sections: {
        problem: "Medical bills are long, opaque and frequently wrong, and patients rarely have the time or expertise to audit them.",
        howItWorks: "An LLM pipeline extracts line items from bills and flags charges that look inconsistent, deployed on AWS.",
        results: "Identified 80% of overbilling cases in evaluation; won HackMT '24.",
      },
    },
    {
      title: "Weather & Air Pollution Data Collector",
      summary: "A published PyPI package that automates environmental data retrieval for 1K+ cities, reducing redundant API calls by 70%.",
      category: "SYSTEMS",
      status: "COMPLETED",
      hue: 145,
      skills: ["Python"],
      areas: ["Data Mining", "Medical Imaging"],
      sections: {
        problem: "Research pipelines that join environmental data (weather, air quality) with other datasets spend a lot of effort re-fetching the same data.",
        howItWorks: "A Python package with caching and batching around environmental APIs, published to PyPI.",
        results: "Covers 1K+ cities; reduced redundant API calls by 70%.",
      },
    },
    {
      title: "Quantum Encrypted Voting System",
      summary: "A quantum-secured voting prototype built with the Amazon Braket SDK, achieving 100% encryption integrity in simulation.",
      category: "RESEARCH",
      status: "PROTOTYPE",
      hue: 290,
      skills: ["Python", "Amazon Braket", "AWS"],
      areas: ["Quantum Information"],
      sections: {
        problem: "Explore how quantum key distribution ideas could secure a voting protocol.",
        howItWorks: "Quantum circuits simulated with Amazon Braket generate and verify keys used to protect ballots.",
        results: "100% encryption integrity in simulation.",
      },
    },
    {
      title: "Interactive Algorithm Visualizations",
      summary: "Generator-driven visualizations where the algorithm itself produces every frame — play, pause and step through real code.",
      category: "WEB",
      status: "ACTIVE",
      hue: 185,
      placeholder: true,
      skills: ["TypeScript", "Next.js", "Three.js"],
      areas: ["AI Systems"],
      sections: {
        problem: "Most algorithm animations are either beautiful but uncontrollable, or controllable but disconnected from real code.",
        howItWorks: "Each algorithm is a generator that yields frames; the UI is a small state machine (ready → playing ↔ paused → done).\n\n::component{name=\"sorting-visualizer\" algorithm=\"bubble\" size=\"16\"}",
        results: "[Placeholder] Link a live demo and repository.",
      },
    },
    {
      title: "Agentic AI Experiments",
      summary: "Experiments with tool-using language-model agents: planning, retrieval and evaluation.",
      category: "AI",
      status: "ACTIVE",
      hue: 35,
      placeholder: true,
      skills: ["Python", "LangChain", "LlamaIndex", "FastAPI"],
      areas: ["AI Systems", "Natural Language Processing"],
      sections: {
        problem: "[Placeholder] Describe the agentic system and the question it explores.",
        results: "[Placeholder]",
      },
    },
  ];

  const projectIds: Record<string, string> = {};
  for (const [i, p] of projects.entries()) {
    const slug = slugify(p.title);
    const media = await cover(slug, p.hue, "PROJECTS");
    const created = await db.project.create({
      data: {
        slug,
        title: p.title,
        summary: p.summary,
        category: p.category,
        status: p.status,
        startDate: p.start ? d(p.start) : null,
        endDate: p.end ? d(p.end) : null,
        githubUrl: p.githubUrl ?? null,
        featured: p.featured ?? false,
        isPlaceholder: p.placeholder ?? false,
        recognition: p.recognition ?? null,
        order: i,
        coverId: media.id,
        skills: { connect: skill(...p.skills) },
        areas: { connect: area(...p.areas) },
        ...p.sections,
      },
    });
    projectIds[p.title] = created.id;
  }

  // ─── Research ──────────────────────────────────────────────────────────
  await db.researchProject.create({
    data: {
      slug: "cross-site-variability-in-brain-mri",
      title: "Cross-Site Variability in Multicenter Brain MRI",
      abstract:
        "Automated MRI analysis pipelines for 5K+ scans to evaluate cross-site variability in brain volume measurements, integrating environmental data (air quality, weather) with imaging datasets.",
      question: "How much of the variation in brain-volume measurements across sites is driven by acquisition differences rather than biology — and can harmonisation recover the signal?",
      methodology:
        "- Automated preprocessing and regional volume extraction across sites\n- Integration of environmental covariates (air quality, weather) using Python and scikit-learn\n- Data harmonisation and statistical modelling of site effects",
      datasets: "[Placeholder] Describe the datasets used (name, sites, number of subjects) where publicly shareable.",
      experiments: "[Placeholder] Summarise the experiments and comparisons.",
      results: "Enhanced reproducibility of multicenter studies by 22% via data harmonisation and statistical modelling.",
      institution: "Vanderbilt Institute for Surgery and Engineering (VISE)",
      collaborators: "[Placeholder] Add lab and collaborators with their permission.",
      status: "COMPLETED",
      startDate: d("2025-06-01"),
      endDate: d("2025-08-31"),
      featured: true,
      order: 0,
      areas: { connect: area("Medical Imaging", "Machine Learning", "Data Mining") },
      skills: { connect: skill("Python", "scikit-learn", "MRI analysis", "Statistical modelling") },
      projects: { connect: [{ id: projectIds["Weather & Air Pollution Data Collector"]! }] },
    },
  });
  await db.researchProject.create({
    data: {
      slug: "quality-smoothness-duality-in-vaes",
      title: "On the Quality–Smoothness Duality in Variational Autoencoders",
      abstract: "[Placeholder] A study of the trade-off between reconstruction quality and latent-space smoothness in VAEs, using controlled benchmarks across model variants.",
      question: "Is the tension between sharp reconstructions and smooth latent spaces fundamental, or an artefact of common modelling choices?",
      methodology: "Controlled experiments varying one design choice at a time (KL weighting, decoder capacity, latent dimensionality) under a shared training harness.",
      results: "[Placeholder] In progress.",
      status: "ONGOING",
      isPlaceholder: true,
      featured: true,
      order: 1,
      areas: { connect: area("Generative Models", "Machine Learning") },
      skills: { connect: skill("Python", "PyTorch") },
      projects: { connect: [{ id: projectIds["VAE Benchmark"]! }] },
    },
  });
  await db.researchProject.create({
    data: {
      slug: "legislative-summarisation-with-transformers",
      title: "Legislative Bill Summarisation with Transformers",
      abstract: "Fine-tuned T5-small transformer models for legislative summarisation, improving ROUGE scores by 21% and serving summaries through a real-time API with under 1.5 s latency.",
      question: "Can compact transformer models produce useful summaries of long legislative text under real-time latency constraints?",
      methodology: "Fine-tuning T5-small on legislative text; evaluation with ROUGE; deployment as a low-latency API.",
      datasets: "Processed 2M+ tokens across datasets.",
      results: "ROUGE improved by 21%; real-time API with <1.5 s latency.",
      institution: "Middle Tennessee State University",
      status: "COMPLETED",
      startDate: d("2025-01-01"),
      endDate: d("2025-05-31"),
      order: 2,
      areas: { connect: area("Natural Language Processing", "Machine Learning") },
      skills: { connect: skill("Python", "Hugging Face", "FastAPI") },
    },
  });
  await db.researchProject.create({
    data: {
      slug: "decision-making-under-uncertainty",
      title: "Decision-Making Under Uncertainty",
      abstract: "[Placeholder] Exploring exploration–exploitation trade-offs and how epistemic uncertainty should shape when an agent gathers information versus acts.",
      question: "When is information worth paying for?",
      status: "PLANNED",
      isPlaceholder: true,
      order: 3,
      areas: { connect: area("Uncertainty", "AI Systems") },
      skills: { connect: skill("Python", "Statistical modelling") },
    },
  });

  // ─── Experience / Education / Awards (from CV) ─────────────────────────
  const experiences = [
    {
      role: "Research Intern",
      organization: "Vanderbilt Institute for Surgery and Engineering (VISE)",
      location: "Nashville, TN",
      type: "RESEARCH",
      startDate: d("2025-06-01"),
      endDate: d("2025-08-31"),
      period: "Summer 2025",
      summary: "Medical imaging research on multicenter brain MRI.",
      highlights:
        "Built automated MRI analysis pipelines for 5K+ scans to evaluate cross-site variability in brain volume.\nIntegrated environmental data (air quality, weather) with MRI datasets using Python and scikit-learn.\nEnhanced reproducibility of multicenter studies by 22% via data harmonisation and statistical modelling.",
      skills: ["Python", "scikit-learn", "MRI analysis", "Statistical modelling"],
    },
    {
      role: "AI R&D Engineer",
      organization: "Bill Summary API Project, MTSU",
      location: "Murfreesboro, TN",
      type: "WORK",
      startDate: d("2025-01-01"),
      endDate: d("2025-05-31"),
      period: "Jan — May 2025",
      summary: "Transformer-based summarisation of legislation.",
      highlights: "Fine-tuned T5-small transformer models for legislative summarisation, improving ROUGE scores by 21%.\nProcessed 2M+ tokens across datasets; deployed a real-time API with <1.5s latency.",
      skills: ["Python", "Hugging Face", "FastAPI"],
    },
    {
      role: "Artificial Intelligence Intern",
      organization: "MindWise Health",
      type: "INTERNSHIP",
      startDate: d("2024-06-01"),
      endDate: d("2024-07-31"),
      period: "Jun — Jul 2024",
      summary: "Retrieval-augmented assistants for healthcare.",
      highlights: "Developed a RAG chatbot with MongoDB vector search and LangChain, increasing response accuracy by 18%.\nProposed an EHR-driven AI analytics pipeline for predictive healthcare management, adopted for pilot testing.",
      skills: ["Python", "LangChain", "MongoDB"],
    },
    {
      role: "Vice President",
      organization: "ACM MTSU",
      location: "Murfreesboro, TN",
      type: "LEADERSHIP",
      startDate: d("2023-01-01"),
      endDate: d("2025-12-31"),
      period: "2023 — 2025",
      summary: "Student chapter of the Association for Computing Machinery.",
      highlights: "Directed 10+ workshops and MTSU's first coding competition (30+ participants).\nMentored peers in ML modelling, cloud deployment and software engineering.",
      skills: [],
    },
  ];
  for (const [i, e] of experiences.entries()) {
    const { skills: s, ...rest } = e;
    await db.experience.create({ data: { ...rest, order: i, skills: { connect: skill(...s) } } });
  }

  await db.education.create({
    data: { institution: "Vanderbilt University", degree: "M.S.", field: "Computer Science", location: "Nashville, TN", endDate: d("2026-12-15"), expected: true, order: 0 },
  });
  await db.education.create({
    data: {
      institution: "Middle Tennessee State University",
      degree: "B.S.",
      field: "Computer Science",
      location: "Murfreesboro, TN",
      endDate: d("2025-08-08"),
      notes: "Dean's List\nMerit Scholarship Recipient",
      order: 1,
    },
  });

  const awards = [
    { title: "Hacker's Choice Award", issuer: "HackMT '25", date: d("2025-02-01"), description: "For the AI Elder Care System." },
    { title: "Winner", issuer: "HackMT '24", date: d("2024-02-01"), description: "For BlueAid, an LLM-based medical bill analysis tool." },
    { title: "Dean's List", issuer: "Middle Tennessee State University", date: null, description: null },
    { title: "Merit Scholarship", issuer: "Middle Tennessee State University", date: null, description: null },
  ];
  for (const [i, a] of awards.entries()) await db.award.create({ data: { ...a, order: i } });

  // ─── Personal ──────────────────────────────────────────────────────────
  const socials = [
    { platform: "github", label: "GitHub", url: "https://github.com/jainish1510", handle: "jainish1510" },
    { platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/jainishpatel", handle: "jainishpatel" },
    { platform: "email", label: "Email", url: "mailto:jainish.h.patel@vanderbilt.edu", handle: "jainish.h.patel@vanderbilt.edu" },
    { platform: "spotify", label: "Spotify", url: "https://open.spotify.com", handle: "[Placeholder]", visible: false },
    { platform: "rss", label: "RSS", url: "/rss.xml", handle: null },
  ];
  for (const [i, s] of socials.entries()) await db.socialLink.create({ data: { ...s, order: i } });

  const now = [
    { label: "Studying", value: "M.S. Computer Science", detail: "Vanderbilt University", icon: "graduation" },
    { label: "Research", value: "Machine Learning · Medical Imaging", detail: null, icon: "microscope" },
    { label: "Building", value: "This studio — a portfolio & publication", detail: "Next.js · SQLite · WebGL", icon: "hammer" },
    { label: "Learning", value: "Reinforcement learning · fMRI analysis", detail: null, icon: "book" },
    { label: "Based in", value: "Nashville, TN", detail: null, icon: "pin" },
  ];
  for (const [i, n] of now.entries()) await db.nowItem.create({ data: { ...n, order: i } });

  const timeline = [
    { year: 2023, title: "Vice President, ACM MTSU", description: "Started leading workshops and organising the chapter's first coding competition.", kind: "COMMUNITY" },
    { year: 2024, title: "HackMT '24 — Winner", description: "BlueAid: an LLM-based medical bill analysis tool deployed on AWS.", kind: "BUILD", link: "/projects/blueaid" },
    { year: 2024, title: "AI Intern, MindWise Health", description: "Built a retrieval-augmented chatbot with MongoDB vector search and LangChain.", kind: "WORK" },
    { year: 2025, title: "HackMT '25 — Hacker's Choice", description: "Led a four-person team building an AI elder-care system.", kind: "BUILD", link: "/projects/ai-elder-care-system" },
    { year: 2025, title: "AI R&D Engineer, MTSU", description: "Fine-tuned transformers for legislative summarisation.", kind: "RESEARCH" },
    { year: 2025, title: "Research Intern, VISE", description: "Multicenter brain MRI pipelines and data harmonisation at Vanderbilt.", kind: "RESEARCH", link: "/research/cross-site-variability-in-brain-mri" },
    { year: 2025, title: "B.S. Computer Science, MTSU", description: "Graduated; Dean's List and Merit Scholarship recipient.", kind: "EDUCATION" },
    { year: 2025, title: "Started M.S. at Vanderbilt", description: "Graduate study in computer science, focused on machine learning.", kind: "EDUCATION" },
    { year: 2026, title: "M.S. Computer Science (expected)", description: "Expected December 2026.", kind: "EDUCATION" },
  ];
  for (const [i, t] of timeline.entries()) await db.timelineEvent.create({ data: { ...t, order: i } });

  const learning = [
    { topic: "Reinforcement Learning", note: "Bandits → MDPs → policy gradients", progress: 45 },
    { topic: "fMRI Analysis", note: "From structural to functional imaging", progress: 25 },
    { topic: "Agentic AI", note: "Tool use, planning and evaluation", progress: 55 },
    { topic: "WebGL", note: "Shaders and instanced rendering", progress: 40 },
  ];
  for (const [i, l] of learning.entries()) await db.learningItem.create({ data: { ...l, order: i } });

  const facts = [
    "I led a four-person team at HackMT '25 that built an AI elder-care system — it won Hacker's Choice.",
    "I published a Python package on PyPI that gathers weather and air-quality data for over a thousand cities.",
    "As ACM vice president I helped run MTSU's first coding competition.",
    "I've simulated a quantum-secured voting protocol with Amazon Braket.",
    "Every cover image on this site is generated from code, seeded by the title of the post.",
  ];
  for (const [i, text] of facts.entries()) await db.fact.create({ data: { text, order: i } });

  const interests = [
    { name: "Hackathons", description: "Building something real in a weekend is the best forcing function I know." },
    { name: "Teaching & mentoring", description: "Workshops taught me that explaining something is the fastest way to find the gaps in my own understanding." },
    { name: "Interactive visualization", description: "If an idea can be explored with a slider, it can be understood faster." },
    { name: "Quantum computing", description: "A field where intuition fails constantly — which makes it fun." },
  ];
  for (const [i, it] of interests.entries()) await db.interest.create({ data: { ...it, order: i } });

  await db.goal.create({ data: { text: "Complete the M.S. in Computer Science at Vanderbilt", horizon: "Dec 2026", order: 0 } });
  await db.goal.create({ data: { text: "Write here regularly — experiments, notes and lessons", horizon: "2026", order: 1 } });
  await db.goal.create({ data: { text: "[Placeholder] Add your research goal for the year", horizon: "2026", order: 2 } });

  await db.personalWidget.create({
    data: {
      key: "spotify",
      title: "Now playing",
      order: 0,
      config: JSON.stringify({ title: "Time", artist: "Hans Zimmer", album: "Inception (Music from the Motion Picture)", url: "https://open.spotify.com/search/Time%20Hans%20Zimmer", durationMs: 275000 }),
    },
  });
  await db.personalWidget.create({ data: { key: "github", title: "GitHub activity", order: 1 } });
  await db.personalWidget.create({ data: { key: "clock", title: "Local time", order: 2 } });
  await db.personalWidget.create({ data: { key: "random_fact", title: "A random fact", order: 3 } });

  // ─── Posts ─────────────────────────────────────────────────────────────
  const read = (f: string) => readFile(path.join(process.cwd(), "prisma/seed-content", f), "utf8");
  const posts = [
    {
      file: "vae.md",
      title: "Understanding Variational Autoencoders Through Experiments",
      subtitle: "Start from what breaks, then let the math explain why.",
      category: "Research Notes",
      tags: ["Machine Learning", "Generative Models", "VAE", "PyTorch"],
      areas: ["Generative Models", "Machine Learning"],
      date: "2026-09-18",
      featured: true,
      hue: 265,
    },
    {
      file: "multi-cloud.md",
      title: "What I Learned Building a Multi-Cloud Deployment System",
      subtitle: "Infrastructure is a control loop, not a script.",
      category: "Building",
      tags: ["Cloud", "Distributed Systems", "DevOps"],
      areas: ["Cloud & Systems"],
      date: "2026-08-27",
      hue: 205,
    },
    {
      file: "medical.md",
      title: "Notes From Learning Medical Imaging",
      subtitle: "Images are measurements, and every site leaves a fingerprint.",
      category: "Research Notes",
      tags: ["Medical Imaging", "MRI", "Machine Learning", "Reproducibility"],
      areas: ["Medical Imaging"],
      date: "2026-08-02",
      hue: 175,
    },
    {
      file: "uncertainty.md",
      title: "Why Decision-Making Under Uncertainty Is Hard",
      subtitle: "Not knowing is cheap. Finding out is what costs.",
      category: "Essays",
      tags: ["Decision Making", "Probability", "Reinforcement Learning"],
      areas: ["Uncertainty", "AI Systems"],
      date: "2026-07-12",
      hue: 35,
    },
    {
      file: "algorithms.md",
      title: "Building Interactive Algorithm Visualizations",
      subtitle: "Let the algorithm produce every frame.",
      category: "Building",
      tags: ["Visualization", "Algorithms", "TypeScript"],
      areas: ["AI Systems"],
      date: "2026-06-20",
      hue: 185,
    },
    {
      file: "agentic-draft.md",
      title: "Notes on Agentic AI Systems",
      subtitle: "Planning, tools, memory — and why evaluation is the bottleneck.",
      category: "Research Notes",
      tags: ["Agentic AI", "LLMs"],
      areas: ["AI Systems"],
      status: "DRAFT",
      hue: 50,
    },
  ];

  const postIds: string[] = [];
  for (const p of posts) {
    const content = await read(p.file);
    const slug = slugify(p.title);
    const media = await cover(slug, p.hue);
    const tagRows = p.tags.map((name) => ({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) } }));
    const created = await db.post.create({
      data: {
        slug,
        title: p.title,
        subtitle: p.subtitle,
        content,
        excerpt: makeExcerpt(content.replace(/:::callout[\s\S]*?:::/, "")),
        readingTime: readingTime(content),
        status: p.status ?? "PUBLISHED",
        featured: p.featured ?? false,
        publishedAt: p.date ? d(p.date) : null,
        isDemo: true,
        authorId: admin.id,
        categoryId: categories[p.category]!.id,
        coverId: media.id,
        tags: { connectOrCreate: tagRows },
        areas: { connect: area(...p.areas) },
        revisions: { create: { title: p.title, subtitle: p.subtitle, content, note: "seed" } },
      },
    });
    if ((p.status ?? "PUBLISHED") === "PUBLISHED") postIds.push(created.id);
  }

  // ─── Demo engagement ───────────────────────────────────────────────────
  if (withDemo) await seedDemoEngagement(postIds);

  const counts = {
    posts: await db.post.count(),
    projects: await db.project.count(),
    research: await db.researchProject.count(),
    media: await db.media.count(),
    comments: await db.comment.count(),
    views: await db.view.count(),
  };
  console.log("Seed complete:", counts);
}

async function seedDemoEngagement(postIds: string[]) {
  const rand = (() => {
    let s = 1337;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  })();
  const referrers = [null, null, null, "https://www.google.com/", "https://www.linkedin.com/", "https://github.com/", "https://news.ycombinator.com/", "https://duckduckgo.com/"];
  const devices = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];
  const now = Date.now();
  const meta = JSON.stringify({ demo: true });

  const views: { postId: string; visitorId: string; referrer: string | null; device: string; metadata: string; createdAt: Date }[] = [];
  const likes: { postId: string; visitorId: string; createdAt: Date }[] = [];
  for (const [rank, postId] of postIds.entries()) {
    const total = Math.round(420 / (rank + 1) + 40 + rand() * 60);
    for (let i = 0; i < total; i++) {
      const ref = referrers[Math.floor(rand() * referrers.length)]!;
      views.push({
        postId,
        visitorId: `demo-${Math.floor(rand() * 5000)}`,
        referrer: ref ? new URL(ref).hostname.replace(/^www\./, "") : null,
        device: devices[Math.floor(rand() * devices.length)]!,
        metadata: meta,
        createdAt: new Date(now - Math.pow(rand(), 1.6) * 60 * 86400000),
      });
    }
    const likeCount = Math.round(total * (0.06 + rand() * 0.05));
    for (let i = 0; i < likeCount; i++) likes.push({ postId, visitorId: `demo-like-${rank}-${i}`, createdAt: new Date(now - rand() * 60 * 86400000) });
  }
  await db.view.createMany({ data: views });
  await db.like.createMany({ data: likes });
  for (let i = 0; i < 40; i++) {
    await db.bookmark.create({ data: { postId: postIds[i % postIds.length]!, visitorId: `demo-bm-${i}`, createdAt: new Date(now - rand() * 50 * 86400000) } });
  }
  for (let i = 0; i < 30; i++) {
    await db.event.create({ data: { type: "project_click", entityType: "project", entityId: (await db.project.findFirst({ skip: i % 6, select: { id: true } }))!.id, visitorId: `demo-${i}`, metadata: meta } });
  }

  const vae = postIds[0]!;
  const comment = (data: { postId: string; authorName: string; content: string; parentId?: string; depth?: number; status?: string; isAuthor?: boolean; daysAgo: number }) =>
    db.comment.create({
      data: {
        postId: data.postId,
        authorName: data.authorName,
        content: data.content,
        parentId: data.parentId ?? null,
        depth: data.depth ?? 0,
        status: data.status ?? "APPROVED",
        isAuthor: data.isAuthor ?? false,
        isDemo: true,
        createdAt: new Date(now - data.daysAgo * 86400000),
      },
    });
  const c1 = await comment({ postId: vae, authorName: "Alex (demo)", content: "Great explanation of the β trade-off. The interactive KL figure made the closed form click for me.", daysAgo: 9 });
  const r1 = await comment({ postId: vae, authorName: "Jainish Patel", isAuthor: true, parentId: c1.id, depth: 1, content: "Thanks! Seeing the KL go to zero only when the two curves overlap was what motivated the figure.", daysAgo: 8 });
  await comment({ postId: vae, authorName: "Alex (demo)", parentId: r1.id, depth: 2, content: "That makes sense — it's the cost of moving away from the prior.", daysAgo: 8 });
  await comment({ postId: vae, authorName: "Sam (demo)", content: "Would love a follow-up comparing VQ-VAE on the same benchmark.", daysAgo: 4 });
  await comment({ postId: postIds[1]!, authorName: "Riley (demo)", content: "The 'observation over memory' principle is underrated. Learned that one the hard way.", daysAgo: 12 });
  await comment({ postId: postIds[3]!, authorName: "Morgan (demo)", content: "The bandit simulation is a great touch. Interesting how fast greedy fails when the gap is small.", daysAgo: 3 });
  // Moderation queue examples
  await comment({ postId: postIds[2]!, authorName: "Taylor (demo)", content: "Is the harmonisation step done before or after feature extraction in your pipeline?", status: "PENDING", daysAgo: 1 });
  await comment({ postId: vae, authorName: "Jordan (demo)", content: "Could you share the training config for the β = 4 run?", status: "PENDING", daysAgo: 0.5 });
  await comment({ postId: vae, authorName: "cheap-seo-services (demo)", content: "Buy backlinks and SEO services now!!! click here http://spam.example http://spam.example", status: "SPAM", daysAgo: 2 });
  await db.commentLike.createMany({ data: Array.from({ length: 7 }, (_, i) => ({ commentId: c1.id, visitorId: `demo-cl-${i}` })) });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
