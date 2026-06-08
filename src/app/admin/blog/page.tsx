import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { getAdminPosts } from "@/lib/queries/blog";

export const metadata = { title: "Blog | Admin" };

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-50 text-green-700 border-green-200",
  draft:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  archived:  "bg-gray-50 text-gray-500 border-gray-200",
};

type SP = { search?: string; page?: string };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getAdminPosts({
    search: sp.search,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Blog Posts{" "}
          <span className="text-gray-400 font-normal text-base sm:text-lg">({total})</span>
        </h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Search */}
      <form method="GET">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="Search posts…"
          className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </form>

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Title", "Status", "Author", "Published", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No posts found.
                </td>
              </tr>
            ) : (
              rows.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-400 font-mono">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[post.status] ?? ""}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{post.authorName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          View ↗
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/blog?${sp.search ? `search=${sp.search}&` : ""}page=${p}`}
              className={`h-8 w-8 flex items-center justify-center rounded-md text-sm ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
