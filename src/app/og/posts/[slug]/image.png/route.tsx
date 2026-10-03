import { ogCard } from "@/lib/og";
import { getPublishedPostBySlug, listPublishedSlugs } from "@/lib/repositories/posts";
import { getSite } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listPublishedSlugs().map((slug) => ({ slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = getPublishedPostBySlug((await params).slug);
  return ogCard({ eyebrow: post?.category?.name ?? "Writing", title: post?.title ?? "Not found", subtitle: post?.subtitle, footer: `${getSite().name}${post ? ` · ${post.readingTime} min read` : ""}` });
}
