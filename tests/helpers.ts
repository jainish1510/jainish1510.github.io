import { db } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import type { PostInput } from "@/lib/validation";

export async function resetDb() {
  // Children first.
  await db.commentLike.deleteMany();
  await db.comment.deleteMany();
  await db.like.deleteMany();
  await db.bookmark.deleteMany();
  await db.view.deleteMany();
  await db.event.deleteMany();
  await db.postRevision.deleteMany();
  await db.post.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();
  await db.session.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.user.deleteMany();
  await db.skill.deleteMany();
  await db.project.deleteMany();
}

export async function makeAdmin(email = "admin@test.dev", password = "correct horse battery") {
  return db.user.create({ data: { email, name: "Test Admin", passwordHash: await hashPassword(password) } });
}

export function postInput(overrides: Partial<PostInput> = {}): PostInput {
  return {
    title: "Testing the Pipeline",
    subtitle: "A subtitle",
    slug: "testing-the-pipeline",
    excerpt: null,
    content: "## Intro\n\nSome **bold** text and $x^2$.\n\n```ts\nconst a = 1;\n```",
    status: "DRAFT",
    featured: false,
    categoryId: null,
    coverId: null,
    tags: ["Testing", "Pipelines"],
    areaIds: [],
    publishedAt: null,
    seoTitle: null,
    seoDescription: null,
    ...overrides,
  };
}
