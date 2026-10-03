import type { Root, RootContent, Parent } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit, SKIP } from "unist-util-visit";
import { createEmbed, isSafeVideoSrc, isYouTubeId, youtubeEmbed } from "./embeds";

/**
 * Directive syntax supported in posts (via remark-directive):
 *
 *   ::youtube[Title]{id="aircAruvnKk"}
 *   ::video[Caption]{src="/media/blog/demo.mp4" poster="/media/blog/poster.png"}
 *   ::embed[Title]{url="https://codepen.io/…"}
 *   ::component{name="gaussian-explorer"}        ← interactive React component
 *   :::gallery … images … :::
 *   :::callout{kind="note" title="Heads up"} … :::
 *
 * Directives become custom `x-*` elements, which the sanitizer allow-lists
 * and the renderer maps to React components.
 */

type DirectiveNode = RootContent & {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: RootContent[];
  data?: { hName?: string; hProperties?: Record<string, string | number | boolean | null | undefined> };
};

const isDirective = (node: { type: string }): node is DirectiveNode =>
  node.type === "containerDirective" || node.type === "leafDirective" || node.type === "textDirective";

const COMPONENT_NAME = /^[a-z][a-z0-9-]{1,40}$/;

function asElement(node: DirectiveNode, hName: string, hProperties: Record<string, string | undefined>, keepChildren = false) {
  node.data = { ...(node.data ?? {}), hName, hProperties } as never;
  if (!keepChildren) node.children = [];
}

function fallbackText(node: DirectiveNode): RootContent {
  const label = toString(node);
  return { type: "text", value: `:${node.name}${label ? label : ""}` } as RootContent;
}

export function remarkStudioDirectives() {
  return (tree: Root) => {
    visit(tree, (node, index, parent: Parent | undefined) => {
      if (!isDirective(node)) return;
      const attrs = node.attributes ?? {};
      const label = node.type === "containerDirective" ? "" : toString(node);

      switch (node.name) {
        case "youtube": {
          const id = String(attrs.id ?? "");
          if (node.type !== "textDirective" && isYouTubeId(id)) {
            const spec = youtubeEmbed(id);
            asElement(node, "x-embed", { provider: "youtube", src: spec.src, poster: spec.thumbnail, title: label || "YouTube video" });
            return SKIP;
          }
          break;
        }
        case "video": {
          const src = String(attrs.src ?? "");
          const poster = String(attrs.poster ?? "");
          if (node.type !== "textDirective" && isSafeVideoSrc(src)) {
            asElement(node, "x-embed", {
              provider: "video",
              src,
              poster: poster.startsWith("/media/") ? poster : undefined,
              title: label || "Video",
            });
            return SKIP;
          }
          break;
        }
        case "embed": {
          const spec = node.type !== "textDirective" ? createEmbed(String(attrs.url ?? ""), label || "Embedded media") : null;
          if (spec) {
            asElement(node, "x-embed", { provider: spec.provider, src: spec.src, title: spec.title, poster: spec.thumbnail });
            return SKIP;
          }
          break;
        }
        case "component": {
          const name = String(attrs.name ?? "");
          if (node.type === "leafDirective" && COMPONENT_NAME.test(name)) {
            const { name: _omit, ...props } = attrs;
            asElement(node, "x-component", { component: name, props: JSON.stringify(props).slice(0, 2000), title: label || undefined });
            return SKIP;
          }
          break;
        }
        case "gallery":
          if (node.type === "containerDirective") {
            asElement(node, "x-gallery", {}, true);
            return;
          }
          break;
        case "callout":
          if (node.type === "containerDirective") {
            const kind = ["note", "tip", "warning", "demo"].includes(String(attrs.kind)) ? String(attrs.kind) : "note";
            asElement(node, "x-callout", { kind, title: attrs.title ? String(attrs.title) : undefined }, true);
            return;
          }
          break;
      }

      // Unknown or invalid directive: restore it as literal text so prose like
      // "ratio 3:1" or "Note:this" is never swallowed.
      if (parent && typeof index === "number") {
        if (node.type === "textDirective") {
          parent.children.splice(index, 1, fallbackText(node) as never);
        } else {
          parent.children.splice(index, 1, {
            type: "paragraph",
            children: [{ type: "text", value: `${node.type === "containerDirective" ? ":::" : "::"}${node.name}${label ? `[${label}]` : ""}` }],
          } as never);
        }
        return [SKIP, index];
      }
    });
  };
}
