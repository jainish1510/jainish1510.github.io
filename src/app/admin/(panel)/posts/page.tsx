import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shell";
import { PostsTable } from "@/components/admin/posts-table";
import { buttonVariants } from "@/components/ui/button";
import type { PostStatus } from "@/lib/constants";
import { adminListPosts, postStatusCounts } from "@/lib/repositories/posts";
import { db } from "@/lib/db/client";

export const metadata = { title: "Posts" };

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; category?: string; sort?: string }> }) {
  const sp = await searchParams;
  const status = (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(sp.status ?? "") ? sp.status : "ALL") as PostStatus | "ALL";
  const [posts, counts, categories] = await Promise.all([
    adminListPosts({ status, q: sp.q, category: sp.category, sort: (sp.sort as "updated" | "published" | "views") ?? "updated" }),
    postStatusCounts(),
    db.category.findMany({ select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader
        title="Posts"
        description={`${counts.PUBLISHED} published · ${counts.DRAFT} drafts · ${counts.ARCHIVED} archived`}
        actions={
          <Link href="/admin/posts/new" className={buttonVariants({ variant: "primary" })}>
            <Plus /> New post
          </Link>
        }
      />
      <PostsTable
        posts={posts.map((p) => ({ ...p, publishedAt: p.publishedAt?.toISOString() ?? null, updatedAt: p.updatedAt.toISOString() }))}
        counts={counts}
        categories={categories}
        filters={{ status, q: sp.q ?? "", category: sp.category ?? "", sort: sp.sort ?? "updated" }}
      />
    </>
  );
}
