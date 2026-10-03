import type { Root, Text, PhrasingContent } from "mdast";
import { visit, SKIP } from "unist-util-visit";

/**
 * `++text++` → <u>text</u>. Markdown has no underline syntax and raw HTML is
 * disabled, so this tiny transform provides one without opening up HTML.
 */
export function remarkUnderline() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number" || !node.value.includes("++")) return;
      const parts = node.value.split(/\+\+([^+\n]+)\+\+/);
      if (parts.length === 1) return;
      const out: PhrasingContent[] = parts
        .map((value, i) =>
          i % 2
            ? ({ type: "emphasis", data: { hName: "u" }, children: [{ type: "text", value }] } as PhrasingContent)
            : value
              ? ({ type: "text", value } as PhrasingContent)
              : null,
        )
        .filter((n): n is PhrasingContent => n !== null);
      parent.children.splice(index, 1, ...(out as never[]));
      return [SKIP, index + out.length];
    });
  };
}
