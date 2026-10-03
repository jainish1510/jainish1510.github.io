import { beforeEach, describe, expect, it } from "vitest";
import { getCollection } from "@/lib/admin/collections";
import { createSession, deleteSession, findSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { listCollectionItems, saveCollectionItem } from "@/lib/repositories/collections";
import { createMedia, deleteMedia } from "@/lib/repositories/media";
import { UploadError } from "@/lib/media/storage";
import { getSettings, saveSettings } from "@/lib/settings";
import { makeAdmin, resetDb } from "../helpers";

beforeEach(resetDb);

describe("sessions", () => {
  it("creates, finds and revokes opaque sessions; only the hash is stored", async () => {
    const admin = await makeAdmin();
    const { token } = await createSession(admin.id, "vitest");
    const stored = await db.session.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token);
    expect((await findSession(token))?.user.email).toBe("admin@test.dev");
    await deleteSession(token);
    expect(await findSession(token)).toBeNull();
  });

  it("rejects expired and malformed tokens", async () => {
    const admin = await makeAdmin();
    const { token } = await createSession(admin.id);
    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findSession(token)).toBeNull();
    expect(await db.session.count()).toBe(0); // expired session cleaned up
    expect(await findSession("not-a-token")).toBeNull();
  });
});

describe("generic collections", () => {
  it("validates and creates items with relations", async () => {
    const skills = getCollection("skills")!;
    const created = await saveCollectionItem(skills, null, { name: "Rust", slug: "rust", category: "LANGUAGES", proficiency: 2, usedFor: "", areas: [], favorite: true, order: 1 });
    expect(created.ok).toBe(true);
    const projects = getCollection("projects")!;
    const bad = await saveCollectionItem(projects, null, { title: "", slug: "Bad Slug", summary: "", category: "ML", status: "ACTIVE" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors)).toEqual(expect.arrayContaining(["title", "slug", "summary"]));
    const ok = await saveCollectionItem(projects, null, {
      title: "Thing",
      slug: "thing",
      summary: "A thing",
      category: "ML",
      status: "ACTIVE",
      skills: created.ok ? [created.id] : [],
      areas: [],
      gallery: [],
    });
    expect(ok.ok).toBe(true);
    const items = await listCollectionItems(projects);
    expect(items[0]?.skills).toHaveLength(1);
  });

  it("reports duplicate slugs as a form error", async () => {
    const tags = getCollection("tags")!;
    await saveCollectionItem(tags, null, { name: "A", slug: "a" });
    const dup = await saveCollectionItem(tags, null, { name: "B", slug: "a" });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.errors.form).toMatch(/already exists/);
  });
});

describe("settings", () => {
  it("falls back to defaults and persists overrides", async () => {
    await db.siteSetting.deleteMany();
    expect((await getSettings())["site.name"]).toBe("Jainish Patel");
    await saveSettings({ "site.roles": "Tester", "not.a.key": "x" } as never);
    expect(await db.siteSetting.count()).toBe(1);
  });
});

describe("media uploads", () => {
  it("stores valid images with dimensions and rejects disguised files", async () => {
    // 1×1 transparent PNG
    const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"));
    const media = await createMedia(png, { originalName: "dot.png", folder: "BLOG" });
    expect(media).toMatchObject({ mimeType: "image/png", width: 1, height: 1, folder: "BLOG" });
    expect(media.path).toMatch(/^\/media\/blog\/.+\.png$/);
    await expect(createMedia(new TextEncoder().encode("<svg onload=alert(1)>".padEnd(40)), { originalName: "x.png", folder: "BLOG" })).rejects.toBeInstanceOf(UploadError);
    await deleteMedia(media.id);
    expect(await db.media.count({ where: { id: media.id } })).toBe(0);
  });
});
