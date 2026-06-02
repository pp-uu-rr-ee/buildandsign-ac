"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts, tags, postTags } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/session";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  coverImageAlt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  metaTitle: z.string().max(160).optional().or(z.literal("")),
  metaDescription: z.string().max(320).optional().or(z.literal("")),
  focusKeyword: z.string().optional().or(z.literal("")),
  targetCity: z.string().optional().or(z.literal("")),
  targetProvince: z.string().optional().or(z.literal("")),
  readingTimeMinutes: z.coerce.number().int().min(1).optional().or(z.literal("")),
  tagsCsv: z.string().optional(),
});

export type PostFormResult =
  | { success: true; postId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createPostAction(
  _prev: PostFormResult,
  formData: FormData
): Promise<PostFormResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const raw = extractRaw(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tagsCsv, readingTimeMinutes, coverImageUrl, ...rest } = parsed.data;

  const [post] = await db
    .insert(posts)
    .values({
      ...rest,
      authorId: session.userId,
      coverImageUrl: coverImageUrl || null,
      coverImageAlt: rest.coverImageAlt || null,
      metaTitle: rest.metaTitle || null,
      metaDescription: rest.metaDescription || null,
      focusKeyword: rest.focusKeyword || null,
      targetCity: rest.targetCity || null,
      targetProvince: rest.targetProvince || null,
      readingTimeMinutes: readingTimeMinutes !== "" && readingTimeMinutes ? Number(readingTimeMinutes) : null,
      publishedAt: rest.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id });

  await syncTags(post.id, tagsCsv ?? "");

  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  return { success: true, postId: post.id };
}

export async function updatePostAction(
  _prev: PostFormResult,
  formData: FormData
): Promise<PostFormResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const raw = extractRaw(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tagsCsv, readingTimeMinutes, coverImageUrl, ...rest } = parsed.data;

  const [current] = await db
    .select({ status: posts.status, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  const publishedAt =
    rest.status === "published" && current?.status !== "published"
      ? new Date()
      : (current?.publishedAt ?? null);

  await db
    .update(posts)
    .set({
      ...rest,
      coverImageUrl: coverImageUrl || null,
      coverImageAlt: rest.coverImageAlt || null,
      metaTitle: rest.metaTitle || null,
      metaDescription: rest.metaDescription || null,
      focusKeyword: rest.focusKeyword || null,
      targetCity: rest.targetCity || null,
      targetProvince: rest.targetProvince || null,
      readingTimeMinutes: readingTimeMinutes !== "" && readingTimeMinutes ? Number(readingTimeMinutes) : null,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));

  await syncTags(id, tagsCsv ?? "");

  revalidatePath("/blog");
  revalidatePath(`/blog/${rest.slug}`);
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}/edit`);

  return { success: true, postId: id };
}

export async function deletePostAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  await db.delete(posts).where(eq(posts.id, id));

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function incrementViewCountAction(postId: string): Promise<void> {
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
}

function extractRaw(formData: FormData): Record<string, string> {
  const keys = [
    "title", "slug", "excerpt", "content", "coverImageUrl", "coverImageAlt",
    "status", "metaTitle", "metaDescription", "focusKeyword", "targetCity",
    "targetProvince", "readingTimeMinutes", "tagsCsv",
  ];
  return Object.fromEntries(keys.map((k) => [k, (formData.get(k) as string) ?? ""]));
}

async function syncTags(postId: string, tagsCsv: string): Promise<void> {
  await db.delete(postTags).where(eq(postTags.postId, postId));

  if (!tagsCsv.trim()) return;

  const tagNames = tagsCsv
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  for (const name of tagNames) {
    const slug = name.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) continue;

    const [tag] = await db
      .insert(tags)
      .values({ name, slug })
      .onConflictDoUpdate({ target: tags.slug, set: { name } })
      .returning({ id: tags.id });

    await db
      .insert(postTags)
      .values({ postId, tagId: tag.id })
      .onConflictDoNothing();
  }
}
