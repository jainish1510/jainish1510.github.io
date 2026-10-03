import { ogCard, OG_SIZE } from "@/lib/og";
import { getPublishedPostBySlug } from "@/lib/repositories/posts";
import { getSettings } from "@/lib/settings";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Article cover";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [post, s] = await Promise.all([getPublishedPostBySlug((await params).slug), getSettings()]);
  return ogCard({
    eyebrow: post?.category?.name ?? "Writing",
    title: post?.title ?? "Not found",
    subtitle: post?.subtitle,
    footer: `${s["site.name"]}${post ? ` · ${post.readingTime} min read` : ""}`,
  });
}
