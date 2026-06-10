"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, type CreateProductResult } from "@/lib/actions/admin";
import { SpecsEditor, SERIES_SPEC_SUGGESTIONS } from "./SpecsEditor";

const initialState: CreateProductResult = { success: false, error: "" };

const CATEGORIES = ["split", "window", "portable", "central", "cassette", "ducted"] as const;
const STATUSES   = ["draft", "active", "archived", "out_of_stock"] as const;

export function ProductCreateForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (state.success) {
      router.push(`/admin/products/${state.productId}/edit`);
    }
  }, [state, router]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const generated = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
    setSlug(generated);
  }

  const fe = !state.success && state.fieldErrors ? state.fieldErrors : {};
  const globalError = !state.success && !state.fieldErrors && state.error ? state.error : null;

  return (
    <form action={formAction} className="space-y-5">
      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* EN / TH name section */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Product Name</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Name (English)"
            name="name"
            required
            placeholder="e.g. Daikin 1.5HP Inverter Split Type"
            onChange={handleNameChange}
            error={fe.name?.[0]}
          />
          <Field
            label="ชื่อสินค้า (ภาษาไทย)"
            name="nameTh"
            placeholder="เช่น แอร์ไดกิ้น 1.5 แรงม้า อินเวอร์เตอร์"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="daikin-1-5hp-inverter-split"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            URL: /products/<span className="font-mono">{slug || "…"}</span>
          </p>
          {fe.slug && <p className="mt-1 text-xs text-red-600">{fe.slug[0]}</p>}
        </div>
      </div>

      {/* Short description */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Short Description</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Short Description (English)"
            name="shortDescription"
            placeholder="One-line summary shown on product cards"
          />
          <Field
            label="คำอธิบายสั้น (ภาษาไทย)"
            name="shortDescriptionTh"
            placeholder="สรุปสั้นๆ แสดงบนการ์ดสินค้า"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField label="Category" name="category" options={CATEGORIES} defaultValue="split" />
        <SelectField label="Status"   name="status"   options={STATUSES}   defaultValue="draft" />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
        After creating the series, add sizes (variants) on the edit page. Price,
        SKU, and stock live on each variant.
      </div>

      {/* Series-shared specs — Brand, Type, Voltage, EER, Warranty… */}
      <SpecsEditor
        name="specifications"
        label="Specifications (shared across all sizes)"
        hint="Brand, Type, Voltage, Refrigerant, EER, Warranty, …"
        suggestedKeys={SERIES_SPEC_SUGGESTIONS}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isFeatured"
          name="isFeatured"
          className="h-4 w-4 accent-blue-600"
        />
        <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
          Featured product (shown on homepage)
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating…" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label, name, type = "text", defaultValue, required,
  placeholder, error, hint, onChange,
}: {
  label: string; name: string; type?: string; defaultValue?: string;
  required?: boolean; placeholder?: string; error?: string; hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue}
        placeholder={placeholder} required={required} onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {hint  && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({
  label, name, options, defaultValue,
}: {
  label: string; name: string; options: readonly string[]; defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name} name={name} defaultValue={defaultValue}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
