import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PostForm } from "@/components/admin/PostForm";

export const metadata = { title: "New Post | Admin" };

export default function AdminNewPostPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/blog" className="hover:text-gray-700">Blog</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">New Post</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">New Post</h1>

      <PostForm />
    </div>
  );
}
