import type { Element, Root as HastRoot } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { remarkStudioDirectives } from "./directives";
import { remarkUnderline } from "./underline";

export type TocEntry = { id: string; text: string; depth: 2 | 3 };

/**
 * The sanitizer runs *before* KaTeX and syntax highlighting, so only markup we
 * generate ourselves is added after untrusted input has been cleaned. Raw HTML
 * in markdown is never parsed (no rehype-raw), so it renders as text.
 */
export const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "x-embed", "x-gallery", "x-callout", "x-component"],
  attributes: {
    ...defaultSchema.attributes,
    "x-embed": ["provider", "src", "title", "poster"],
    "x-callout": ["kind", "title"],
    "x-component": ["component", "props", "title"],
    code: [["className", /^language-[\w-]+$/, "math-inline", "math-display"]],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
    poster: ["http", "https"],
  },
};

function rehypeCollectToc() {
  return (tree: HastRoot, file: VFile) => {
    const toc: TocEntry[] = [];
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties?.id === "string") {
        toc.push({ id: node.properties.id, text: hastToString(node), depth: node.tagName === "h2" ? 2 : 3 });
      }
    });
    file.data.toc = toc;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkDirective)
  .use(remarkStudioDirectives)
  .use(remarkUnderline)
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeKatex, { throwOnError: false, strict: "ignore" } as never)
  .use(rehypeHighlight, { detect: false, plainText: ["mermaid", "text", "txt", "plain"] })
  .use(rehypeSlug)
  .use(rehypeCollectToc);

/** Markdown → sanitized HAST + table of contents. Synchronous and isomorphic. */
export function markdownToHast(markdown: string): { tree: HastRoot; toc: TocEntry[] } {
  const file = new VFile(markdown);
  const tree = processor.runSync(processor.parse(file), file) as HastRoot;
  return { tree, toc: (file.data.toc as TocEntry[] | undefined) ?? [] };
}
