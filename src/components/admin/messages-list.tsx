"use client";

import { Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMessageAction, markMessageAction } from "@/app/admin/actions/site";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { cn, relativeTime } from "@/lib/utils";

type M = { id: string; name: string; email: string; message: string; read: boolean; createdAt: string };

export function MessagesList({ messages }: { messages: M[] }) {
  const router = useRouter();
  if (!messages.length) return <EmptyState title="No messages yet." description="Messages sent from /contact appear here." />;
  return (
    <ul className="max-w-3xl space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={cn("rounded-xl border p-5", m.read ? "border-line bg-surface/50" : "border-accent/40 bg-surface")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg">
              {!m.read ? <span className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle" /> : null}
              {m.name} <span className="text-muted">· {m.email}</span>
            </p>
            <span className="text-xs text-subtle">{relativeTime(m.createdAt)}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-fg-2">{m.message}</p>
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`} onClick={() => markMessageAction(m.id, true)}>
                <Mail /> Reply by email
              </a>
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => (await markMessageAction(m.id, !m.read), router.refresh())}>
              Mark {m.read ? "unread" : "read"}
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={async () => (confirm("Delete this message?") ? (await deleteMessageAction(m.id), router.refresh()) : null)}>
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
