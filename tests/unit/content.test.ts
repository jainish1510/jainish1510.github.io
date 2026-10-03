import { toHtml } from "hast-util-to-html";
import { describe, expect, it } from "vitest";
import { createEmbed, isSafeVideoSrc } from "@/lib/content/embeds";
import { markdownToHast } from "@/lib/content/markdown";
import { makeExcerpt, readingTime, slugify, stripMarkdown } from "@/lib/content/text";

const html = (md: string) => toHtml(markdownToHast(md).tree);

describe("markdown pipeline", () => {
  it("renders headings with ids and collects a table of contents", () => {
    const { toc } = markdownToHast("## First Section\n\ntext\n\n### Sub Part\n\n## Second");
    expect(toc).toEqual([
      { id: "first-section", text: "First Section", depth: 2 },
      { id: "sub-part", text: "Sub Part", depth: 3 },
      { id: "second", text: "Second", depth: 2 },
    ]);
  });

  it("never renders raw HTML (XSS)", () => {
    const out = html('Hello <script>alert(1)</script> <img src=x onerror="alert(1)"> <iframe src="https://evil.test"></iframe>');
    expect(out).not.toMatch(/<script|onerror|<iframe/i);
  });

  it("strips javascript: links", () => {
    expect(html("[click](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("renders inline and display math with KaTeX", () => {
    const out = html("Inline $E=mc^2$\n\n$$\n\\int_0^1 x\\,dx\n$$");
    expect(out).toContain('class="katex"');
    expect(out).toContain("katex-display");
  });

  it("highlights code and leaves mermaid untouched for the client", () => {
    const out = html("```ts\nconst a = 1\n```\n\n```mermaid\ngraph TD; A-->B\n```");
    expect(out).toContain("hljs-keyword");
    expect(out).toContain('class="language-mermaid"');
  });

  it("supports GFM tables and underline", () => {
    const out = html("| a | b |\n|---|---|\n| 1 | 2 |\n\nThis is ++underlined++.");
    expect(out).toContain("<table>");
    expect(out).toContain("<u>underlined</u>");
  });

  it("turns directives into allow-listed embed elements", () => {
    const out = html('::youtube[Talk]{id="aircAruvnKk"}\n\n::component{name="gaussian-explorer" mu="1"}\n\n:::callout{kind="tip"}\nHi\n:::');
    expect(out).toContain('<x-embed provider="youtube" src="https://www.youtube-nocookie.com/embed/aircAruvnKk?rel=0"');
    expect(out).toContain('component="gaussian-explorer"');
    expect(out).toContain('<x-callout kind="tip"');
  });

  it("rejects invalid directive input and keeps prose like ratios intact", () => {
    const out = html('::youtube{id="not valid id!"}\n\nThe ratio is 3:1 and Note:this stays.\n\n::embed{url="https://evil.test/x"}');
    expect(out).not.toContain("x-embed");
    expect(out).toContain("3:1");
    expect(out).toContain("Note:this");
  });

  it("only allows local or https video files", () => {
    expect(isSafeVideoSrc("/media/blog/a.mp4")).toBe(true);
    expect(isSafeVideoSrc("https://cdn.test/v.webm")).toBe(true);
    expect(isSafeVideoSrc("javascript:alert(1)//.mp4")).toBe(false);
    expect(isSafeVideoSrc("/media/../../etc/passwd.mp4")).toBe(false);
  });
});

describe("embed factory", () => {
  it.each([
    ["https://www.youtube.com/watch?v=aircAruvnKk", "youtube"],
    ["https://youtu.be/aircAruvnKk", "youtube"],
    ["https://vimeo.com/123456", "vimeo"],
    ["https://codepen.io/user/pen/abcDEF", "codepen"],
    ["https://observablehq.com/@d3/force-directed-graph", "observable"],
  ])("recognises %s", (url, provider) => {
    expect(createEmbed(url)?.provider).toBe(provider);
  });

  it("refuses unknown hosts and non-https", () => {
    expect(createEmbed("https://example.com/video")).toBeNull();
    expect(createEmbed("http://www.youtube.com/watch?v=aircAruvnKk")).toBeNull();
    expect(createEmbed("not a url")).toBeNull();
  });
});

describe("text utilities", () => {
  it("slugifies titles", () => {
    expect(slugify("Understanding VAEs — Through Experiments!")).toBe("understanding-vaes-through-experiments");
    expect(slugify("Café & Crème")).toBe("cafe-and-creme");
    expect(slugify("   ")).toBe("");
  });

  it("estimates reading time with a one-minute floor", () => {
    expect(readingTime("short")).toBe(1);
    expect(readingTime(Array(1150).fill("word").join(" "))).toBe(5);
  });

  it("strips markdown for excerpts", () => {
    expect(stripMarkdown("## Title\n\n**Bold** and [link](https://x.test) `code`")).toBe("Title Bold and link code");
    const excerpt = makeExcerpt("word ".repeat(100), 40);
    expect(excerpt.length).toBeLessThanOrEqual(41);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});
