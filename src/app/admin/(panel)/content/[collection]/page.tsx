import { notFound } from "next/navigation";
import { CollectionManager } from "@/components/admin/collection-manager";
import { PageHeader } from "@/components/admin/shell";
import { getCollection } from "@/lib/admin/collections";
import { listCollectionItems, relationOptions } from "@/lib/repositories/collections";

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  return { title: getCollection((await params).collection)?.label ?? "Content" };
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const def = getCollection(collection);
  if (!def) notFound();
  const [items, options] = await Promise.all([listCollectionItems(def), relationOptions()]);
  // Dates → ISO strings for the client boundary.
  const serialisable = items.map((i) => Object.fromEntries(Object.entries(i).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]))) as (Record<string, unknown> & { id: string })[];
  return (
    <>
      <PageHeader title={def.label} description={def.description} />
      <CollectionManager collectionKey={def.key} items={serialisable} options={options} />
    </>
  );
}
