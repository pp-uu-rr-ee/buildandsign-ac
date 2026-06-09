"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/lib/actions/admin";

const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled"];

type Props = { orderId: string; currentStatus: string };

export function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: string) =>
    startTransition(async () => {
      await updateOrderStatusAction(orderId, status);
      toast.success("Order status updated");
    });

  return (
    <div className="rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900 text-sm">Update Status</h2>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Order Status</label>
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isPending || s === currentStatus}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                s === currentStatus
                  ? "bg-blue-600 text-white cursor-default"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              }`}
            >
              {s.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
