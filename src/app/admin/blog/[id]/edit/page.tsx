import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PostForm } from "@/components/admin/PostForm";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { getPostByIdForEdit } from "@/lib/queries/blog";

export const metadata = { title: "Edit Post | Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostByIdForEdit(id);
  if (!post) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/blog" className="hover:text-gray-700">Blog</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <DeletePostButton id={post.id} />
      </div>

      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          coverImageAlt: post.coverImageAlt,
          status: post.status,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          focusKeyword: post.focusKeyword,
          targetCity: post.targetCity,
          targetProvince: post.targetProvince,
          readingTimeMinutes: post.readingTimeMinutes,
          tags: post.tags,
        }}
      />
    </div>
  );
}
