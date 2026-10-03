/**
 * Pure text-editing operations for the markdown editor. Each returns the new
 * value plus the selection to restore, so they're trivially unit-testable.
 */
export type EditResult = { value: string; selectionStart: number; selectionEnd: number };

export function wrapSelection(value: string, start: number, end: number, before: string, after = before, placeholder = "text"): EditResult {
  const selected = value.slice(start, end);
  // Toggle off when the selection is already wrapped.
  if (value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after) {
    return {
      value: value.slice(0, start - before.length) + selected + value.slice(end + after.length),
      selectionStart: start - before.length,
      selectionEnd: end - before.length,
    };
  }
  const inner = selected || placeholder;
  return {
    value: value.slice(0, start) + before + inner + after + value.slice(end),
    selectionStart: start + before.length,
    selectionEnd: start + before.length + inner.length,
  };
}

/** Insert a block on its own lines, separated from surrounding text by blank lines. */
export function insertBlock(value: string, start: number, end: number, block: string, cursorOffset?: number): EditResult {
  const beforeText = value.slice(0, start);
  const afterText = value.slice(end);
  const lead = beforeText.length === 0 || beforeText.endsWith("\n\n") ? "" : beforeText.endsWith("\n") ? "\n" : "\n\n";
  const trail = afterText.startsWith("\n\n") ? "" : afterText.startsWith("\n") ? "\n" : "\n\n";
  const next = beforeText + lead + block + trail + afterText;
  const caret = beforeText.length + lead.length + (cursorOffset ?? block.length);
  return { value: next, selectionStart: caret, selectionEnd: caret };
}

/** Prefix every selected line (lists, quotes, headings). */
export function prefixLines(value: string, start: number, end: number, prefix: string | ((i: number) => string)): EditResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = value.indexOf("\n", end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const p = (i: number) => (typeof prefix === "function" ? prefix(i) : prefix);
  const allPrefixed = lines.every((l, i) => l.startsWith(p(i)));
  const updated = lines.map((l, i) => (allPrefixed ? l.slice(p(i).length) : p(i) + l.replace(/^(#{1,6} |> |- |\d+\. )/, ""))).join("\n");
  return {
    value: value.slice(0, lineStart) + updated + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + updated.length,
  };
}

export const SNIPPETS = {
  codeBlock: (lang = "ts") => `\`\`\`${lang}\n\n\`\`\``,
  mathBlock: () => "$$\n\\mathcal{L} = \\mathbb{E}[\\log p(x \\mid z)]\n$$",
  table: () => "| Column | Column |\n| --- | --- |\n| Cell | Cell |",
  mermaid: () => "```mermaid\nflowchart LR\n  A[Idea] --> B[Prototype] --> C[Result]\n```",
  callout: (kind = "note") => `:::callout{kind="${kind}"}\nWrite the callout here.\n:::`,
  youtube: (id: string, title = "Video") => `::youtube[${title}]{id="${id}"}`,
  video: (src: string, title = "Video") => `::video[${title}]{src="${src}"}`,
  embed: (url: string, title = "Embed") => `::embed[${title}]{url="${url}"}`,
  component: (name: string) => `::component{name="${name}"}`,
  image: (src: string, alt: string, caption?: string) => `![${alt}](${src}${caption ? ` "${caption.replace(/"/g, "'")}"` : ""})`,
  gallery: (images: string[]) => `:::gallery\n${images.join("\n")}\n:::`,
  divider: () => "---",
};
