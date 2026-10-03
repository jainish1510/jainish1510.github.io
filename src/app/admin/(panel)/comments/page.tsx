import { PageHeader } from "@/components/admin/shell";
import { CommentModeration } from "@/components/admin/comment-moderation";
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { adminListComments, commentStatusCounts } from "@/lib/repositories/comments";

export const metadata = { title: "Comments" };

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string; post?: string; order?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (COMMENT_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as CommentStatus) : sp.status === "ALL" ? "ALL" : "PENDING";
  const [comments, counts, posts] = await Promise.all([
    adminListComments({ status, postId: sp.post, order: sp.order === "oldest" ? "oldest" : "newest", q: sp.q }),
    commentStatusCounts(),
    db.post.findMany({ where: { comments: { some: {} } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Comments" description="Only approved comments are public. Spam is scored automatically on arrival." />
      <CommentModeration
        comments={comments.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          content: c.content,
          status: c.status,
          isAuthor: c.isAuthor,
          isDemo: c.isDemo,
          spamScore: c.spamScore,
          createdAt: c.createdAt.toISOString(),
          post: c.post,
          parent: c.parent,
          likes: c._count.likes,
          replies: c._count.replies,
        }))}
        counts={counts}
        posts={posts}
        filters={{ status, post: sp.post ?? "", order: sp.order ?? "newest", q: sp.q ?? "" }}
      />
    </>
  );
}
