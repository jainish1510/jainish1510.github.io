"use client";

import {
  Bold,
  Code,
  Code2,
  Film,
  GalleryHorizontal,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Puzzle,
  Quote,
  Sigma,
  SquareFunction,
  Table,
  Underline,
  Workflow,
  MessageSquareWarning,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToolbarAction =
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "code"
  | "link"
  | "quote"
  | "ul"
  | "ol"
  | "codeblock"
  | "image"
  | "gallery"
  | "video"
  | "math"
  | "mathblock"
  | "table"
  | "mermaid"
  | "callout"
  | "component"
  | "divider";

const GROUPS: { action: ToolbarAction; label: string; icon: ReactNode; shortcut?: string }[][] = [
  [
    { action: "h2", label: "Heading", icon: <Heading2 /> },
    { action: "h3", label: "Subheading", icon: <Heading3 /> },
  ],
  [
    { action: "bold", label: "Bold", icon: <Bold />, shortcut: "⌘B" },
    { action: "italic", label: "Italic", icon: <Italic />, shortcut: "⌘I" },
    { action: "underline", label: "Underline", icon: <Underline />, shortcut: "⌘U" },
    { action: "code", label: "Inline code", icon: <Code />, shortcut: "⌘E" },
    { action: "link", label: "Link", icon: <Link2 />, shortcut: "⌘K" },
  ],
  [
    { action: "quote", label: "Quote", icon: <Quote /> },
    { action: "ul", label: "Bulleted list", icon: <List /> },
    { action: "ol", label: "Numbered list", icon: <ListOrdered /> },
    { action: "divider", label: "Divider", icon: <Minus /> },
  ],
  [
    { action: "image", label: "Image", icon: <ImageIcon /> },
    { action: "gallery", label: "Gallery", icon: <GalleryHorizontal /> },
    { action: "video", label: "Video / embed", icon: <Film /> },
  ],
  [
    { action: "codeblock", label: "Code block", icon: <Code2 /> },
    { action: "math", label: "Inline math", icon: <Sigma /> },
    { action: "mathblock", label: "Equation", icon: <SquareFunction /> },
    { action: "table", label: "Table", icon: <Table /> },
    { action: "mermaid", label: "Mermaid diagram", icon: <Workflow /> },
    { action: "callout", label: "Callout", icon: <MessageSquareWarning /> },
    { action: "component", label: "Interactive component", icon: <Puzzle /> },
  ],
];

export function Toolbar({ onAction, className }: { onAction: (a: ToolbarAction) => void; className?: string }) {
  return (
    <div role="toolbar" aria-label="Formatting" className={cn("flex items-center gap-0.5 overflow-x-auto", className)}>
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5 border-r border-line pr-1 last:border-0 [&:not(:first-child)]:pl-1">
          {group.map((item) => (
            <button
              key={item.action}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAction(item.action)}
              title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
              aria-label={item.label}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-fg [&_svg]:size-4"
            >
              {item.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
