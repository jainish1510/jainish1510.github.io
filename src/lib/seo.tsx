import type { SocialLink } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import type { Settings } from "@/lib/settings";

/** Renders JSON-LD safely (escapes `<` so content can't close the script tag). */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function personSchema(settings: Settings, socials: Pick<SocialLink, "url" | "platform">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings["site.name"],
    url: env.siteUrl,
    jobTitle: "Graduate Student, Computer Science",
    description: settings["site.description"],
    alumniOf: [{ "@type": "CollegeOrUniversity", name: "Middle Tennessee State University" }],
    affiliation: { "@type": "CollegeOrUniversity", name: "Vanderbilt University" },
    knowsAbout: ["Machine Learning", "Medical Imaging", "Data Mining", "Generative Models", "Cloud Computing", "Software Engineering"],
    sameAs: socials.filter((s) => /^https?:/.test(s.url)).map((s) => s.url),
  };
}

export function articleSchema(post: {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string };
  cover?: { path: string } | null;
  tags: { name: string }[];
  category?: { name: string } | null;
}) {
  const url = `${env.siteUrl}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    alternativeHeadline: post.subtitle ?? undefined,
    description: post.excerpt ?? post.subtitle ?? undefined,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name, url: env.siteUrl },
    image: post.cover ? `${env.siteUrl}${post.cover.path}` : undefined,
    keywords: post.tags.map((t) => t.name).join(", "),
    articleSection: post.category?.name,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${env.siteUrl}${item.path}` })),
  };
}
