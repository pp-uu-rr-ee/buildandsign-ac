import { db } from "@/db";
import { posts, tags, postTags, users } from "@/db/schema";
import { eq, desc, and, count, ilike } from "drizzle-orm";

export async function getPublishedPosts({ page = 1, limit = 9 }: { page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImageUrl: posts.coverImageUrl,
        coverImageAlt: posts.coverImageAlt,
        publishedAt: posts.publishedAt,
        readingTimeMinutes: posts.readingTimeMinutes,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(posts).where(eq(posts.status, "published")),
  ]);

  return { rows, total, pages: Math.ceil(total / limit), page };
}

export async function getPostBySlug(slug: string) {
  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      coverImageAlt: posts.coverImageAlt,
      publishedAt: posts.publishedAt,
      readingTimeMinutes: posts.readingTimeMinutes,
      metaTitle: posts.metaTitle,
      metaDescription: posts.metaDescription,
      status: posts.status,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!row) return null;

  const postTagRows = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, row.id));

  return { ...row, tags: postTagRows };
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminPosts({
  page = 1,
  limit = 15,
  search,
}: { page?: number; limit?: number; search?: string } = {}) {
  const where = search ? ilike(posts.title, `%${search}%`) : undefined;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(posts).where(where),
  ]);

  return { rows, total, pages: Math.ceil(total / limit), page };
}

export async function getPostByIdForEdit(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return null;

  const postTagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, id));

  return { ...row, tags: postTagRows };
}
