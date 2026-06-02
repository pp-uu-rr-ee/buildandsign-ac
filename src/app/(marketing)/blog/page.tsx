import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { getPublishedPosts } from "@/lib/queries/blog";
import { getT } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "Blog | Cool Air Services",
  description: "Tips, guides, and updates from our team of AC professionals.",
};

type SP = { page?: string };

export default async function BlogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;
  const t = await getT();

  const { rows, pages } = await getPublishedPosts({ page });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
          {t.blog.title}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          {t.blog.subtitle}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-20 text-center">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t.blog.noPosts}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t.blog.noPostsHint}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover image */}
                {post.coverImageUrl ? (
                  <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.coverImageAlt ?? post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-blue-300 dark:text-blue-700" />
                  </div>
                )}

                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt.toISOString()}>
                        {new Date(post.publishedAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    )}
                    {post.readingTimeMinutes && (
                      <>
                        <span>·</span>
                        <span>{t.blog.minRead(post.readingTimeMinutes)}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link href={`/blog/${post.slug}`} className="stretched-link">
                      {post.title}
                    </Link>
                  </h2>

                  {post.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    {post.authorName && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t.blog.by} {post.authorName}
                      </span>
                    )}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                    >
                      {t.blog.readMore} →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/blog?page=${p}`}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
