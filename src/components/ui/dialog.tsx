"use client";

import { Dialog as RadixDialog } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  hideTitle,
  ...props
}: ComponentProps<typeof RadixDialog.Content> & { title: string; description?: string; hideTitle?: boolean; children: ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_0.2s_ease]" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-[12vh] z-[81] w-[min(92vw,32rem)] -translate-x-1/2 rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl outline-none data-[state=open]:animate-[dialog-in_0.25s_var(--ease-out-expo)]",
          className,
        )}
        {...props}
      >
        <div className={cn("mb-4 pr-8", hideTitle && "sr-only")}>
          <RadixDialog.Title className="text-base font-medium tracking-tight text-fg">{title}</RadixDialog.Title>
          {description ? <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description> : null}
        </div>
        {!description ? <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description> : null}
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-fg" aria-label="Close">
          <X className="size-4" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
