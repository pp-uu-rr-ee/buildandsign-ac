"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { updateProductAction } from "@/lib/actions/admin";
import type { ProductFormResult } from "@/lib/actions/admin";
import type { Product } from "@/types";
import { useEffect } from "react";

const initialState: ProductFormResult = { success: true };

const CATEGORIES = ["split","window","portable","central","cassette","ducted"];
const STATUSES = ["active","draft","archived","out_of_stock"];

export function ProductEditForm({ product }: { product: Product }) {
  const [state, formAction, isPending] = useActionState(updateProductAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Product updated");
  }, [state]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={product.id} />

      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{globalError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Product Name" name="name" defaultValue={product.name} required error={fieldErrors?.name?.[0]} />
        <Field label="Slug" name="slug" defaultValue={product.slug} required error={fieldErrors?.slug?.[0]} />
      </div>

      <Field label="Short Description" name="shortDescription" defaultValue={product.shortDescription ?? ""} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField label="Category" name="category" defaultValue={product.category} options={CATEGORIES} />
        <SelectField label="Status" name="status" defaultValue={product.status} options={STATUSES} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="Price (₱ — enter in pesos)"
          name="priceInPesos"
          type="number"
          defaultValue={String(product.priceInCents / 100)}
          required
          error={fieldErrors?.priceInPesos?.[0]}
          hint="e.g. 28999 for ₱28,999"
        />
        <Field
          label="Compare Price (₱)"
          name="comparePriceInPesos"
          type="number"
          defaultValue={product.comparePriceInCents ? String(product.comparePriceInCents / 100) : ""}
          hint="Crossed-out original price"
        />
        <Field label="Stock" name="stock" type="number" defaultValue={String(product.stock)} required error={fieldErrors?.stock?.[0]} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isFeatured"
          name="isFeatured"
          defaultChecked={product.isFeatured}
          className="h-4 w-4 accent-blue-600"
        />
        <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
          Featured product (shown on homepage and in highlights)
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, required, placeholder, error, hint }: {
  label: string; name: string; type?: string; defaultValue?: string;
  required?: boolean; placeholder?: string; error?: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue}
        placeholder={placeholder} required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue: string; options: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        id={name} name={name} defaultValue={defaultValue}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">{o.replace("_"," ")}</option>
        ))}
      </select>
    </div>
  );
}
