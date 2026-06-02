"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPostAction, updatePostAction, type PostFormResult } from "@/lib/actions/blog";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: "draft" | "published" | "archived";
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  targetCity: string | null;
  targetProvince: string | null;
  readingTimeMinutes: number | null;
  tags: { name: string }[];
};

type Props = { post?: Post };

const initialState: PostFormResult = { success: false, error: "" };

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function PostForm({ post }: Props) {
  const router = useRouter();
  const action = post ? updatePostAction : createPostAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [slug, setSlug] = useState(post?.slug ?? "");

  useEffect(() => {
    if (state.success) {
      router.push("/admin/blog");
    }
  }, [state.success, router]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (post) return; // don't override slug in edit mode
    const generated = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
    setSlug(generated);
  }

  const fe = !state.success && state.fieldErrors ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-8">
      {post && <input type="hidden" name="id" value={post.id} />}

      {/* Core fields */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Content</h2>

        <div>
          <label className={labelClass} htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            required
            defaultValue={post?.title}
            onChange={handleTitleChange}
            placeholder="e.g. How to Clean Your AC Filter at Home"
            className={fieldClass}
          />
          {fe.title && <p className="mt-1 text-xs text-red-500">{fe.title[0]}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="slug">Slug *</label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="how-to-clean-your-ac-filter"
            className={fieldClass}
          />
          {fe.slug && <p className="mt-1 text-xs text-red-500">{fe.slug[0]}</p>}
          <p className="mt-1 text-xs text-gray-400">
            URL: /blog/<span className="font-mono">{slug || "…"}</span>
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt ?? ""}
            placeholder="Short summary shown on listing page (1–2 sentences)"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="content">
            Content (HTML) *
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={20}
            defaultValue={post?.content ?? ""}
            placeholder="<h2>Introduction</h2><p>Your content here…</p>"
            className={`${fieldClass} font-mono text-xs`}
          />
          {fe.content && <p className="mt-1 text-xs text-red-500">{fe.content[0]}</p>}
          <p className="mt-1 text-xs text-gray-400">Enter valid HTML. It will be rendered directly on the blog post page.</p>
        </div>
      </section>

      {/* Meta */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cover & Publishing</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass} htmlFor="coverImageUrl">Cover image URL</label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              defaultValue={post?.coverImageUrl ?? ""}
              placeholder="https://…"
              className={fieldClass}
            />
            {fe.coverImageUrl && <p className="mt-1 text-xs text-red-500">{fe.coverImageUrl[0]}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="coverImageAlt">Cover image alt text</label>
            <input
              id="coverImageAlt"
              name="coverImageAlt"
              defaultValue={post?.coverImageAlt ?? ""}
              placeholder="Describe the image for screen readers"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass} htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              defaultValue={post?.status ?? "draft"}
              className={fieldClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="readingTimeMinutes">Reading time (minutes)</label>
            <input
              id="readingTimeMinutes"
              name="readingTimeMinutes"
              type="number"
              min={1}
              defaultValue={post?.readingTimeMinutes ?? ""}
              placeholder="5"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="tagsCsv">Tags</label>
          <input
            id="tagsCsv"
            name="tagsCsv"
            defaultValue={post?.tags.map((t) => t.name).join(", ") ?? ""}
            placeholder="maintenance, tips, installation"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-gray-400">Comma-separated. Max 10 tags.</p>
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">SEO</h2>

        <div>
          <label className={labelClass} htmlFor="metaTitle">Meta title <span className="text-gray-400 font-normal">(max 160 chars)</span></label>
          <input
            id="metaTitle"
            name="metaTitle"
            maxLength={160}
            defaultValue={post?.metaTitle ?? ""}
            placeholder="Defaults to post title if empty"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="metaDescription">Meta description <span className="text-gray-400 font-normal">(max 320 chars)</span></label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={2}
            maxLength={320}
            defaultValue={post?.metaDescription ?? ""}
            placeholder="Defaults to excerpt if empty"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass} htmlFor="focusKeyword">Focus keyword</label>
            <input
              id="focusKeyword"
              name="focusKeyword"
              defaultValue={post?.focusKeyword ?? ""}
              placeholder="AC cleaning tips"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="targetCity">Target city</label>
            <input
              id="targetCity"
              name="targetCity"
              defaultValue={post?.targetCity ?? ""}
              placeholder="Manila"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="targetProvince">Target province</label>
            <input
              id="targetProvince"
              name="targetProvince"
              defaultValue={post?.targetProvince ?? ""}
              placeholder="Metro Manila"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {!state.success && state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
