import Link from "next/link";
import { PageHeader } from "@/components/admin/shell";
import { COLLECTIONS } from "@/lib/admin/collections";

export const metadata = { title: "Content" };

export default function ContentIndex() {
  const groups = ["Portfolio", "Personal", "Taxonomy"] as const;
  return (
    <>
      <PageHeader title="Content" description="Everything on the site is editable here — no code changes needed." />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="eyebrow mb-3">{g}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLLECTIONS.filter((c) => c.group === g).map((c) => (
                <Link key={c.key} href={`/admin/content/${c.key}`} className="group rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong">
                  <p className="text-sm font-medium text-fg group-hover:text-accent-strong">{c.label}</p>
                  <p className="mt-1 text-xs text-muted">{c.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
