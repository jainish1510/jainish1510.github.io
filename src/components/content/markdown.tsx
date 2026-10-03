import type { Element, ElementContent } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { ComponentProps, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { markdownToHast, type TocEntry } from "@/lib/content/markdown";
import { cn } from "@/lib/utils";
import { ArticleImage } from "./article-image";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { ComponentSlot } from "./component-slot";
import { Embed } from "./embed";
import { Mermaid } from "./mermaid";

type WithNode<T> = T & { node?: Element };

const isWhitespace = (c: ElementContent) => c.type === "text" && !c.value.trim();
const isImage = (c: ElementContent) => c.type === "element" && c.tagName === "img";

function languageOf(node?: Element) {
  const code = node?.children.find((c): c is Element => c.type === "element" && c.tagName === "code");
  const classes = (code?.properties?.className as string[] | undefined) ?? [];
  return classes.find((c) => c.startsWith("language-"))?.slice(9) ?? "text";
}

const components: Partial<Components> = {
  // Paragraphs that only hold images become figure groups (avoids <figure> in <p>).
  p: ({ node, children, ...props }: WithNode<ComponentProps<"p">>) => {
    const kids = node?.children.filter((c) => !isWhitespace(c)) ?? [];
    if (kids.length > 0 && kids.every(isImage)) {
      return <div className={cn("grid gap-3", kids.length > 1 && "sm:grid-cols-2")}>{children}</div>;
    }
    return <p {...props}>{children}</p>;
  },
  pre: ({ node, children }: WithNode<ComponentProps<"pre">>) => {
    const language = languageOf(node);
    const raw = node ? hastToString(node) : "";
    if (language === "mermaid") return <Mermaid code={raw} />;
    return (
      <CodeBlock language={language} raw={raw}>
        {children}
      </CodeBlock>
    );
  },
  a: ({ node: _node, href = "", children, ...props }: WithNode<ComponentProps<"a">>) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow", "data-cursor": "external" } : {})}
      >
        {children}
      </a>
    );
  },
  img: ({ node: _node, src, alt, title }: WithNode<ComponentProps<"img">>) =>
    typeof src === "string" ? <ArticleImage src={src} alt={alt ?? ""} caption={title} /> : null,
  table: ({ node: _node, ...props }: WithNode<ComponentProps<"table">>) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
  "x-embed": ({ provider, src, title, poster }: { provider?: string; src?: string; title?: string; poster?: string }) =>
    provider && src ? <Embed provider={provider} src={src} title={title ?? "Embedded media"} poster={poster} /> : null,
  "x-gallery": ({ children }: { children?: ReactNode }) => (
    <div className="not-prose -mx-2 grid grid-cols-2 gap-2 sm:-mx-10 md:-mx-20 [&>div]:contents">{children}</div>
  ),
  "x-callout": ({ kind, title, children }: { kind?: string; title?: string; children?: ReactNode }) => (
    <Callout kind={kind} title={title}>
      {children}
    </Callout>
  ),
  "x-component": ({ component, props, title }: { component?: string; props?: string; title?: string }) =>
    component ? <ComponentSlot name={component} props={props} title={title} /> : null,
} as Partial<Components>;

export function renderMarkdown(source: string): { content: ReactNode; toc: TocEntry[] } {
  const { tree, toc } = markdownToHast(source);
  const content = toJsxRuntime(tree, { Fragment, jsx, jsxs, components, passNode: true });
  return { content, toc };
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const { content } = renderMarkdown(source);
  return <div className={cn("prose-studio", className)}>{content}</div>;
}
