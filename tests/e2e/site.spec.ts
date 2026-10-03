import { expect, test } from "@playwright/test";

test.describe("home and navigation", () => {
  test("home establishes identity and navigation works", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Jainish Patel" })).toBeVisible();
    await expect(page.getByText("What I'm doing right now.")).toBeVisible();
    if (page.viewportSize()!.width < 1024) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: /Projects/ }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" }).click();
    }
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("built");
  });

  test("command palette searches content in the browser", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut is desktop-only");
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder(/Search articles, projects/);
    await expect(input).toBeVisible();
    await input.fill("variational");
    await expect(page.getByRole("option", { name: /Variational Autoencoders/ }).first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blog\/understanding-variational/);
  });

  test("theme can be switched and is remembered", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Switch to light theme/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test.describe("blog", () => {
  test("filters by category, tag and search, with an empty state", async ({ page }) => {
    await page.goto("/blog/?category=essays");
    const list = page.getByRole("region", { name: "Articles" });
    await expect(list.getByText("Why Decision-Making Under Uncertainty Is Hard")).toBeVisible();
    await expect(list.getByText("Understanding Variational Autoencoders Through Experiments")).toHaveCount(0);
    await page.goto("/blog/?tag=cloud");
    await expect(page.getByText("What I Learned Building a Multi-Cloud Deployment System").first()).toBeVisible();
    await page.goto("/blog/?q=harmonisation");
    await expect(page.getByText("Notes From Learning Medical Imaging").first()).toBeVisible();
    await page.goto("/blog/?q=zzzznotfound");
    await expect(page.getByText("No matching articles.")).toBeVisible();
  });

  test("article renders math, code, diagrams, interactive figures and a table of contents", async ({ page }) => {
    await page.goto("/blog/understanding-variational-autoencoders-through-experiments/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Variational Autoencoders");
    await expect(page.locator(".prose-studio .katex").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy code" }).first()).toBeVisible();
    await expect(page.getByText("KL(q ‖ p)")).toBeVisible(); // interactive Gaussian explorer
    await expect(page.getByRole("button", { name: /Load youtube embed/ })).toBeVisible();
    await expect(page.locator("a[href='#the-objective']").first()).toBeAttached();
    await expect(page.getByRole("link", { name: /Notes From Learning Medical Imaging|What I Learned Building/ }).first()).toBeVisible(); // related / adjacent
  });

  test("a reader can save an article and find it on the saved page", async ({ page }) => {
    await page.goto("/blog/why-decision-making-under-uncertainty-is-hard/");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/bookmarks/");
    await expect(page.getByText("Why Decision-Making Under Uncertainty Is Hard")).toBeVisible();
    await page.getByRole("button", { name: /Remove .* from saved/ }).click();
    await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  });

  test("a draft post is not published", async ({ request }) => {
    expect((await request.get("/blog/notes-on-agentic-ai-systems/")).status()).toBe(404);
    const rss = await (await request.get("/rss.xml")).text();
    expect(rss).not.toContain("Agentic AI Systems");
  });
});

test.describe("portfolio", () => {
  test("projects filter by category", async ({ page }) => {
    await page.goto("/projects/?category=cloud");
    await expect(page.getByRole("heading", { name: "Multi-Cloud Deployment Orchestrator" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "BlueAid" })).toHaveCount(0);
  });

  test("project and research detail pages render", async ({ page }) => {
    await page.goto("/projects/blueaid/");
    await expect(page.getByRole("heading", { level: 1, name: "BlueAid" })).toBeVisible();
    await expect(page.getByText("HackMT '24 — Winner").first()).toBeVisible();
    await page.goto("/research/cross-site-variability-in-brain-mri/");
    await expect(page.getByText("Research question")).toBeVisible();
  });

  test("research graph filters related work", async ({ page }) => {
    await page.goto("/research/");
    await page.getByRole("button", { name: "Medical Imaging — show related work" }).click();
    await expect(page.getByRole("link", { name: "Cross-Site Variability in Multicenter Brain MRI" }).first()).toBeVisible();
  });

  test("about page shows the story, widgets and timeline", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.getByText("A random fact")).toBeVisible();
    await expect(page.getByText("On repeat")).toBeVisible();
    await expect(page.getByText("GitHub", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: /Vice President, ACM MTSU/ }).click();
    await expect(page.getByText(/coding competition/).first()).toBeVisible();
  });

  test("contact page lists links and the email form", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.getByRole("link", { name: /GitHub/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Write the email" })).toBeVisible();
  });
});

test.describe("static hosting", () => {
  test("SEO and data files are real files with the right types", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
    expect((await request.get("/rss.xml")).headers()["content-type"]).toContain("xml");
    const og = await request.get("/og/site.png");
    expect(og.headers()["content-type"]).toBe("image/png");
    const index = await request.get("/search-index.json");
    expect(index.headers()["content-type"]).toContain("json");
    expect((await index.json()).length).toBeGreaterThan(10);
    expect((await request.get("/media/projects/blueaid-cover.png")).headers()["content-type"]).toBe("image/png");
  });

  test("pages carry metadata and structured data", async ({ page }) => {
    await page.goto("/blog/notes-from-learning-medical-imaging/");
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/blog\/notes-from-learning-medical-imaging\/$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\/posts\/notes-from-learning-medical-imaging\/image\.png$/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join("")).toContain("BlogPosting");
  });

  test("there is no admin or API — and unknown pages get the designed 404", async ({ request, page }) => {
    expect((await request.get("/admin/")).status()).toBe(404);
    expect((await request.get("/api/health")).status()).toBe(404);
    const res = await page.goto("/this/does/not/exist/");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("drifted out of the constellation")).toBeVisible();
  });

  test("no console errors on key pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|api\.github\.com|ERR_/.test(m.text()) && errors.push(m.text()));
    for (const url of ["/", "/about/", "/blog/", "/projects/", "/research/", "/experience/", "/search/?q=cloud", "/blog/why-decision-making-under-uncertainty-is-hard/"]) {
      await page.goto(url);
      await page.waitForTimeout(600);
    }
    expect(errors).toEqual([]);
  });
});
