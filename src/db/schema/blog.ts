import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(), // MDX or HTML
  coverImageUrl: text("cover_image_url"),
  coverImageAlt: varchar("cover_image_alt", { length: 255 }),

  authorId: uuid("author_id").references(() => users.id, {
    onDelete: "set null",
  }),

  status: postStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),

  // SEO
  metaTitle: varchar("meta_title", { length: 160 }),
  metaDescription: varchar("meta_description", { length: 320 }),
  focusKeyword: varchar("focus_keyword", { length: 100 }),

  // Local SEO — article can target a specific service area
  targetCity: varchar("target_city", { length: 100 }),
  targetProvince: varchar("target_province", { length: 100 }),

  readingTimeMinutes: integer("reading_time_minutes"),
  viewCount: integer("view_count").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
});

// Many-to-many: posts <-> tags
export const postTags = pgTable("post_tags", {
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  postTags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));
