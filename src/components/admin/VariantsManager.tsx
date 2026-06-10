"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Save, X } from "lucide-react";
import {
  addVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from "@/lib/actions/admin";
import type { ProductVariant } from "@/types";

type Props = {
  productId: string;
  variants: ProductVariant[];
};

export function VariantsManager({ productId, variants }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      const res = await addVariantAction(productId, formData);
      if (res.success) {
        toast.success("Variant added");
        setAdding(false);
        refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleUpdate = (variantId: string, formData: FormData) => {
    startTransition(async () => {
      const res = await updateVariantAction(variantId, formData);
      if (res.success) {
        toast.success("Variant updated");
        setEditingId(null);
        refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (variantId: string, size: string) => {
    if (!confirm(`Delete variant "${size}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteVariantAction(variantId);
      if (res.success) {
        toast.success(`Variant "${size}" deleted`);
        refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">
            Variants <span className="text-gray-400 font-normal">({variants.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Each variant is a buyable size with its own price, SKU, and stock.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add variant
          </button>
        )}
      </div>

      {/* Add new variant form */}
      {adding && (
        <form
          action={handleAdd}
          className="px-5 py-4 border-b border-gray-100 bg-blue-50/40 space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <Field name="size" label="Size" placeholder="1.0 HP" required />
            <Field name="sortOrder" label="Order" type="number" defaultValue="100" />
            <Field name="sku" label="SKU" placeholder="CAR-INV-10HP" />
            <Field name="priceInBaht" label="Price (฿)" type="number" required />
            <Field name="comparePriceInBaht" label="Compare (฿)" type="number" />
            <Field name="stock" label="Stock" type="number" defaultValue="0" required />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save variant
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Existing variants */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Size", "Order", "SKU", "Price (฿)", "Compare (฿)", "Stock", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">
                  No variants yet. Add one above to make this product buyable.
                </td>
              </tr>
            ) : (
              variants.map((v) => {
                const editing = editingId === v.id;
                if (editing) {
                  return (
                    <tr key={v.id} className="bg-blue-50/40">
                      <td colSpan={7} className="px-4 py-3">
                        <form
                          action={(fd) => handleUpdate(v.id, fd)}
                          className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-end"
                        >
                          <Field name="size" label="Size" defaultValue={v.size} required />
                          <Field
                            name="sortOrder"
                            label="Order"
                            type="number"
                            defaultValue={String(v.sortOrder)}
                          />
                          <Field
                            name="sku"
                            label="SKU"
                            defaultValue={v.sku ?? ""}
                          />
                          <Field
                            name="priceInBaht"
                            label="Price (฿)"
                            type="number"
                            defaultValue={String(v.priceInSatang / 100)}
                            required
                          />
                          <Field
                            name="comparePriceInBaht"
                            label="Compare (฿)"
                            type="number"
                            defaultValue={
                              v.comparePriceInSatang
                                ? String(v.comparePriceInSatang / 100)
                                : ""
                            }
                          />
                          <Field
                            name="stock"
                            label="Stock"
                            type="number"
                            defaultValue={String(v.stock)}
                            required
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="submit"
                              disabled={isPending}
                              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 disabled:opacity-50"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isPending}
                              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={v.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setEditingId(v.id)}
                  >
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{v.size}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{v.sortOrder}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono text-xs">
                      {v.sku ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      ฿{(v.priceInSatang / 100).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {v.comparePriceInSatang ? (
                        <span className="line-through">
                          ฿{(v.comparePriceInSatang / 100).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-sm font-medium ${
                          v.stock === 0
                            ? "text-red-500"
                            : v.stock <= v.lowStockThreshold
                            ? "text-orange-500"
                            : "text-gray-700"
                        }`}
                      >
                        {v.stock}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id, v.size)}
                        disabled={isPending}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        step={type === "number" ? "1" : undefined}
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
