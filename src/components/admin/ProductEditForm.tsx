"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { updateProductAction } from "@/lib/actions/admin";
import type { ProductFormResult } from "@/lib/actions/admin";
import type { Product } from "@/types";
import { useEffect } from "react";
import { SpecsEditor, SERIES_SPEC_SUGGESTIONS } from "./SpecsEditor";

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

      {/* Name + Slug */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Product Name</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Name (English)"
            name="name"
            defaultValue={product.name}
            required
            error={fieldErrors?.name?.[0]}
          />
          <Field
            label="ชื่อสินค้า (ภาษาไทย)"
            name="nameTh"
            defaultValue={product.nameTh ?? ""}
            placeholder="เช่น แอร์ไดกิ้น 1.5 แรงม้า อินเวอร์เตอร์"
          />
        </div>
        <Field
          label="Slug"
          name="slug"
          defaultValue={product.slug}
          required
          error={fieldErrors?.slug?.[0]}
        />
      </div>

      {/* Short description */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Short Description</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Short Description (English)"
            name="shortDescription"
            defaultValue={product.shortDescription ?? ""}
          />
          <Field
            label="คำอธิบายสั้น (ภาษาไทย)"
            name="shortDescriptionTh"
            defaultValue={product.shortDescriptionTh ?? ""}
            placeholder="สรุปสั้นๆ แสดงบนการ์ดสินค้า"
          />
        </div>
      </div>

      {/* Full description */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Full Description</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextareaField
            label="Description (English)"
            name="description"
            defaultValue={product.description ?? ""}
            rows={5}
          />
          <TextareaField
            label="คำอธิบาย (ภาษาไทย)"
            name="descriptionTh"
            defaultValue={product.descriptionTh ?? ""}
            placeholder="คำอธิบายสินค้าโดยละเอียดเป็นภาษาไทย"
            rows={5}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField label="Category" name="category" defaultValue={product.category} options={CATEGORIES} />
        <SelectField label="Status" name="status" defaultValue={product.status} options={STATUSES} />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
        Price, SKU, and stock are managed per <strong>variant</strong> (size).
        Open the Variants panel below to edit them.
      </div>

      {/* Series-shared specifications */}
      <SpecsEditor
        name="specifications"
        label="Specifications (shared across all sizes)"
        hint="Brand, Type, Voltage, Refrigerant, EER, Warranty, …"
        defaultValue={product.specifications}
        suggestedKeys={SERIES_SPEC_SUGGESTIONS}
      />

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

function TextareaField({ label, name, defaultValue, placeholder, rows = 4 }: {
  label: string; name: string; defaultValue?: string; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={name} name={name} defaultValue={defaultValue}
        placeholder={placeholder} rows={rows}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
      />
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
