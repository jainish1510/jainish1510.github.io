import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleHeader } from "@/components/blog/article-header";
import { renderMarkdown } from "@/components/content/markdown";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Badge } from "@/components/ui/primitives";
import { getPostForPreview } from "@/lib/repositories/posts";

export const metadata = { title: "Preview" };

/** Full-page preview of the saved version — drafts included. Admin only (layout guard). */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPostForPreview((await params).id);
  if (!post) notFound();
  const { content, toc } = renderMarkdown(post.content);
  return (
    <div className="-mx-4 -my-8 sm:-mx-8 lg:-mx-10 lg:-my-10">
      <div className="sticky top-14 z-40 flex items-center justify-between gap-3 border-b border-warm/30 bg-warm-soft px-6 py-2 text-sm backdrop-blur lg:top-0">
        <span className="flex items-center gap-2 text-fg">
          <Badge tone="warm">preview</Badge> {post.status === "PUBLISHED" ? "Saved version of a published post" : `This ${post.status.toLowerCase()} is not public.`}
        </span>
        <Link href={`/admin/posts/${post.id}/edit`} className="text-fg underline underline-offset-4">
          Back to editor
        </Link>
      </div>
      <ArticleHeader post={{ ...post, isDemo: post.isDemo }} />
      <div className="container-page mt-14 grid gap-12 pb-24 xl:grid-cols-[1fr_44rem_1fr]">
        <aside className="hidden xl:block">
          <TableOfContents toc={toc} className="sticky top-28 max-w-56" />
        </aside>
        <div className="prose-studio min-w-0">{content}</div>
      </div>
    </div>
  );
}
