import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, User, Tag } from "lucide-react";
import { getPostBySlug } from "@/lib/queries/blog";
import { incrementViewCountAction } from "@/lib/actions/blog";
import { getT, getLocale } from "@/lib/helpers/lang";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, t, locale] = await Promise.all([getPostBySlug(slug), getT(), getLocale()]);

  if (!post) notFound();

  // Fire-and-forget view count increment
  incrementViewCountAction(post.id).catch(() => {});

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8 transition-colors"
      >
        {t.blog.backToBlog}
      </Link>

      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-10 bg-gray-100 dark:bg-gray-800">
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
        {post.publishedAt && (
          <div className="flex items-center gap-1.5">
            <span>{t.blog.publishedOn}</span>
            <time dateTime={post.publishedAt.toISOString()} className="font-medium text-gray-700 dark:text-gray-300">
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        )}
        {post.authorName && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{t.blog.by} <span className="font-medium text-gray-700 dark:text-gray-300">{post.authorName}</span></span>
          </div>
        )}
        {post.readingTimeMinutes && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{t.blog.minRead(post.readingTimeMinutes)}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 leading-tight">
        {post.title}
      </h1>

      {/* HTML content */}
      <div
        className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">{t.blog.tags}:</span>
            {post.tags.map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.blog.backToBlog}
        </Link>
      </div>
    </article>
  );
}
