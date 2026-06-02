"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "@/lib/actions/blog";
import { Trash2 } from "lucide-react";

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePostAction(id);
      router.push("/admin/blog");
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
