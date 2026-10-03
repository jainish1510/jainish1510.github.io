"use client";

import { Check, Circle, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { wordCount } from "@/lib/content/text";
import type { EditorPost } from "./post-editor";

/** Publish confirmation with a pre-flight checklist (advisory, not blocking). */
export function PublishDialog({ open, onOpenChange, post, onPublish, busy }: { open: boolean; onOpenChange: (o: boolean) => void; post: EditorPost; onPublish: () => void; busy: boolean }) {
  const scheduled = post.publishedAt && new Date(post.publishedAt).getTime() > Date.now();
  const checks: [string, boolean, boolean][] = [
    ["Title", !!post.title.trim(), true],
    ["Subtitle", !!post.subtitle.trim(), false],
    ["Body has substance (150+ words)", wordCount(post.content) >= 150, false],
    ["Category", !!post.categoryId, false],
    ["At least one tag", post.tags.length > 0, false],
    ["Cover image (otherwise generative)", !!post.coverId, false],
    ["Excerpt (otherwise generated)", !!post.excerpt.trim(), false],
  ];
  const blocking = checks.some(([, ok, required]) => required && !ok);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={scheduled ? "Schedule this post?" : "Publish this post?"} description={scheduled ? `It will go live on ${new Date(post.publishedAt).toLocaleString()}.` : "It will be visible at /blog/" + (post.slug || "…") + " immediately."}>
        <ul className="space-y-2">
          {checks.map(([label, ok, required]) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              {ok ? <Check className="size-4 text-success" /> : <Circle className={required ? "size-4 text-danger" : "size-4 text-subtle"} />}
              <span className={ok ? "text-fg-2" : required ? "text-danger" : "text-muted"}>{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button variant="accent" onClick={onPublish} disabled={busy || blocking}>
            {busy ? <Loader2 className="animate-spin" /> : <Rocket />}
            {scheduled ? "Schedule" : "Publish now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
