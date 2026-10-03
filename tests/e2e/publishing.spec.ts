import { expect, test } from "@playwright/test";

/**
 * The full workflow from the brief:
 * Login → Create post → Add content → Save draft → Preview → Publish →
 * Visit public article → Like → Comment → Moderate → Comment is public.
 */
test("admin writes, previews and publishes a post; readers engage with it", async ({ page, browser }) => {
  const title = `E2E Field Notes ${Date.now()}`;

  // ── Protected route redirects to login ──────────────────────────────
  await page.goto("/admin/posts/new");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);

  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  await page.getByLabel("Password").fill("e2e-password-123456");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/posts\/new/);

  // ── Write ───────────────────────────────────────────────────────────
  await page.locator("#post-title").fill(title);
  await page.locator("#post-subtitle").fill("Written by a robot, read by humans.");
  const body = page.locator("#post-content");
  await body.fill("## Setup\n\nThis paragraph has **bold** text and inline math $a^2 + b^2 = c^2$.\n\n```python\nprint('hello')\n```\n\n");
  await body.press("End");

  // Toolbar inserts a table
  await page.getByRole("button", { name: "Table" }).click();
  await expect(body).toHaveValue(/\| Column \| Column \|/);

  // ── Live preview updates ────────────────────────────────────────────
  const preview = page.getByLabel("Live preview");
  await expect(preview.getByRole("heading", { name: "Setup" })).toBeVisible();
  await expect(preview.locator(".katex").first()).toBeVisible();
  await expect(preview.locator("table")).toBeVisible();

  // ── Tags + category ─────────────────────────────────────────────────
  await page.locator("#ps-tags").fill("E2E Testing");
  await page.locator("#ps-tags").press("Enter");
  await page.locator("#ps-category").selectOption({ label: "Building" });

  // ── Save draft ──────────────────────────────────────────────────────
  await page.getByRole("button", { name: /Save draft/ }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/posts\/\w+\/edit/);
  const postId = page.url().match(/posts\/(\w+)\/edit/)![1]!;

  // Draft is not public
  const slug = await page.locator("#ps-slug").inputValue();
  const draft = await page.request.get(`/blog/${slug}`);
  expect(draft.status()).toBe(404);
  expect(await draft.text()).not.toContain("This paragraph has");

  // ── Full-page preview ───────────────────────────────────────────────
  await page.goto(`/admin/posts/${postId}/preview`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("is not public")).toBeVisible();

  // ── Publish with confirmation ───────────────────────────────────────
  await page.goto(`/admin/posts/${postId}/edit`);
  await page.getByRole("button", { name: "Publish" }).click();
  const dialog = page.getByRole("dialog", { name: /Publish this post/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByLabel(/Notifications/).getByText("Published", { exact: true })).toBeVisible();

  // ── Public article ──────────────────────────────────────────────────
  const reader = await browser.newContext();
  const article = await reader.newPage();
  await article.goto(`/blog/${slug}`);
  await expect(article.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(article.locator(".prose-studio .katex").first()).toBeVisible();
  await expect(article.getByRole("button", { name: "Copy code" })).toBeVisible();
  await expect(article.getByRole("link", { name: "#E2E Testing" })).toBeVisible();

  // Like (optimistic + persisted)
  const like = article.getByRole("button", { name: "Like", exact: true });
  const liked = article.waitForResponse((r) => r.url().endsWith("/like") && r.status() === 200);
  await like.click();
  await expect(article.getByRole("button", { name: "Unlike" })).toHaveAttribute("aria-pressed", "true"); // optimistic
  await liked; // persisted
  await article.reload();
  await expect(article.getByRole("button", { name: "Unlike" })).toBeVisible();

  // Save to reading list
  await article.getByRole("button", { name: "Save" }).click();
  await expect(article.getByText("Saved to your reading list", { exact: true })).toBeVisible();

  // Comment → pending
  await article.getByLabel("Name", { exact: true }).fill("Robot Reader");
  await article.getByLabel("Comment", { exact: true }).fill("This is an end-to-end comment.");
  await article.waitForTimeout(2600); // the form rejects instant (bot-like) submissions
  await article.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(article.getByText(/awaiting moderation/)).toBeVisible();

  // ── Moderate ────────────────────────────────────────────────────────
  await page.goto("/admin/comments?status=PENDING");
  const row = page.locator("li", { hasText: "This is an end-to-end comment." });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText(/→ approved/)).toBeVisible();

  await article.reload();
  await expect(article.getByText("This is an end-to-end comment.")).toBeVisible();

  // Bookmarks page lists it
  await article.goto("/bookmarks");
  await expect(article.getByText(title)).toBeVisible();

  // Search finds it
  const res = await article.request.get(`/api/search?q=${encodeURIComponent("Field Notes")}`);
  const json = (await res.json()) as { results: { title: string }[] };
  expect(json.results.map((r) => r.title)).toContain(title);

  // Logout
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await reader.close();
});
