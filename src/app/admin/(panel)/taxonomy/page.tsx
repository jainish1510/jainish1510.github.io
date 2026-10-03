import { CollectionManager } from "@/components/admin/collection-manager";
import { PageHeader } from "@/components/admin/shell";
import { getCollection } from "@/lib/admin/collections";
import { db } from "@/lib/db/client";
import { listCollectionItems, relationOptions } from "@/lib/repositories/collections";

export const metadata = { title: "Tags & categories" };

export default async function TaxonomyPage() {
  const [categories, tags, options, tagCounts, catCounts] = await Promise.all([
    listCollectionItems(getCollection("categories")!),
    listCollectionItems(getCollection("tags")!),
    relationOptions(),
    db.tag.findMany({ select: { id: true, _count: { select: { posts: true } } } }),
    db.category.findMany({ select: { id: true, _count: { select: { posts: true } } } }),
  ]);
  const withCount = (rows: Record<string, unknown>[], counts: { id: string; _count: { posts: number } }[]) =>
    rows.map((r) => ({ ...r, id: r.id as string, createdAt: undefined, posts: counts.find((c) => c.id === r.id)?._count.posts ?? 0 }));
  return (
    <>
      <PageHeader title="Tags & categories" description="Categories are blog sections; tags are topics. Research areas live under Content → Research areas." />
      <section>
        <h2 className="eyebrow mb-3">Categories</h2>
        <CollectionManager collectionKey="categories" items={withCount(categories, catCounts)} options={options} />
      </section>
      <section className="mt-12">
        <h2 className="eyebrow mb-3">Tags</h2>
        <CollectionManager collectionKey="tags" items={withCount(tags, tagCounts)} options={options} />
      </section>
    </>
  );
}
