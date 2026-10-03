import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [pending, unread] = await Promise.all([db.comment.count({ where: { status: "PENDING" } }), db.contactMessage.count({ where: { read: false } })]);
  return (
    <AdminShell user={{ name: user.name, email: user.email }} badges={{ comments: pending, messages: unread }}>
      {children}
    </AdminShell>
  );
}
