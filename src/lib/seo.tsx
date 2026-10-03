import type { Post, SiteConfig, SocialLink } from "@/lib/store/types";

/** Renders JSON-LD safely (escapes `<` so content can't close the script tag). */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const origin = (site: SiteConfig) => site.url.replace(/\/$/, "");

export function personSchema(site: SiteConfig, socials: Pick<SocialLink, "url">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: origin(site),
    jobTitle: "Graduate Student, Computer Science",
    description: site.description,
    alumniOf: [{ "@type": "CollegeOrUniversity", name: "Middle Tennessee State University" }],
    affiliation: { "@type": "CollegeOrUniversity", name: "Vanderbilt University" },
    knowsAbout: ["Machine Learning", "Medical Imaging", "Data Mining", "Generative Models", "Cloud Computing", "Software Engineering"],
    sameAs: socials.filter((s) => /^https?:/.test(s.url)).map((s) => s.url),
  };
}

export function articleSchema(site: SiteConfig, post: Post) {
  const url = `${origin(site)}/blog/${post.slug}/`;
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
    author: { "@type": "Person", name: post.author.name, url: origin(site) },
    image: `${origin(site)}/og/posts/${post.slug}/image.png`,
    keywords: post.tags.map((t) => t.name).join(", "),
    articleSection: post.category?.name,
  };
}

export function breadcrumbSchema(site: SiteConfig, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${origin(site)}${item.path}` })),
  };
}
