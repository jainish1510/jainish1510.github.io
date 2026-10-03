import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home establishes identity and navigation works", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Jainish Patel" })).toBeVisible();
    await expect(page.getByText("What I'm doing right now.")).toBeVisible();
    const viewport = page.viewportSize()!;
    if (viewport.width < 1024) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: /Projects/ }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" }).click();
    }
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("built");
  });

  test("command palette searches content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut is desktop-only");
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder(/Search articles, projects/);
    await expect(input).toBeVisible();
    await input.fill("variational");
    await expect(page.getByRole("option", { name: /Variational Autoencoders/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("blog filters by category and shows an empty state", async ({ page }) => {
    await page.goto("/blog?category=essays");
    await expect(page.getByText("Why Decision-Making Under Uncertainty Is Hard").first()).toBeVisible();
    await page.goto("/blog?q=zzzznotfound");
    await expect(page.getByText("No matching articles.")).toBeVisible();
  });

  test("research graph filters related work", async ({ page }) => {
    await page.goto("/research");
    await page.getByRole("button", { name: "Medical Imaging — show related work" }).click();
    await expect(page.getByRole("link", { name: "Cross-Site Variability in Multicenter Brain MRI" }).first()).toBeVisible();
  });

  test("about page widgets render with fallbacks", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("A random fact")).toBeVisible();
    await expect(page.getByText(/demo data|Now playing|Last played/).first()).toBeVisible();
  });

  test("SEO endpoints respond", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
    expect((await request.get("/rss.xml")).headers()["content-type"]).toContain("rss");
  });

  test("unknown pages render the designed 404", async ({ page }) => {
    const res = await page.goto("/this/does/not/exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("drifted out of the constellation")).toBeVisible();
  });
});
