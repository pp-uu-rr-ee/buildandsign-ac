"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleProductStatusAction } from "@/lib/actions/admin";

export function ToggleProductStatus({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const isActive = currentStatus === "active";

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleProductStatusAction(id, currentStatus);
          toast.success(isActive ? "Product archived" : "Product activated");
        })
      }
      disabled={isPending}
      className={`text-xs font-medium transition-colors ${
        isActive
          ? "text-red-500 hover:text-red-700"
          : "text-green-600 hover:text-green-800"
      } disabled:opacity-40`}
    >
      {isActive ? "Archive" : "Activate"}
    </button>
  );
}
