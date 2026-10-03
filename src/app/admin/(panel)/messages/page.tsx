import { PageHeader } from "@/components/admin/shell";
import { MessagesList } from "@/components/admin/messages-list";
import { db } from "@/lib/db/client";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Messages" description="From the contact form. Stored locally; never emailed anywhere automatically." />
      <MessagesList messages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
