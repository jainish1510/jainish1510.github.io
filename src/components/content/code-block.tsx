"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";

const LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  py: "Python",
  python: "Python",
  bash: "Shell",
  sh: "Shell",
  yaml: "YAML",
  json: "JSON",
  sql: "SQL",
  text: "Text",
  hcl: "HCL",
  go: "Go",
  rust: "Rust",
};

export function CodeBlock({ language, raw, children }: { language: string; raw: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context) — fail quietly */
    }
  }

  return (
    <div className="group/code not-prose relative -mx-1 overflow-hidden rounded-xl border border-line bg-bg-raised font-mono sm:-mx-6">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{LABELS[language] ?? language}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[0.8125rem] leading-[1.7] sm:px-6">{children}</pre>
    </div>
  );
}
