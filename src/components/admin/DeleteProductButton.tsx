"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/lib/actions/admin";

type Props = {
  id: string;
  name: string;
};

export function DeleteProductButton({ id, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  const canConfirm = confirm.trim().toLowerCase() === "delete";

  const onConfirm = () => {
    if (!canConfirm) return;
    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        toast.success(`Deleted "${name}"`);
        setOpen(false);
        setConfirm("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete product?
                </h2>
                <p className="text-sm text-gray-500 mt-1 break-words">
                  This will permanently remove{" "}
                  <span className="font-medium text-gray-900">{name}</span>{" "}
                  and all its images. Historical orders keep a snapshot of the
                  product name and price.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">delete</code> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="delete"
                autoFocus
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!canConfirm || isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
