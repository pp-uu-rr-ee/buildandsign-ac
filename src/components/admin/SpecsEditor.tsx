"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Row = { key: string; value: string };

type Props = {
  /** Name of the hidden input that holds the JSON payload. The parent form
   *  posts this string; the server action parses it back into JSONB. */
  name: string;
  /** Existing specs from the DB (null/undefined → start with one blank row). */
  defaultValue?: Record<string, string> | null;
  label?: string;
  hint?: string;
  /** Suggested spec names that show up as a datalist autocomplete. */
  suggestedKeys?: string[];
};

/**
 * Dynamic key/value editor for the `specifications` JSONB column. Renders a
 * list of rows the admin can grow/shrink, and serialises them to JSON in a
 * hidden input the parent form picks up on submit. Empty-key rows are dropped.
 */
export function SpecsEditor({
  name,
  defaultValue,
  label = "Specifications",
  hint,
  suggestedKeys,
}: Props) {
  const initial: Row[] =
    defaultValue && Object.keys(defaultValue).length > 0
      ? Object.entries(defaultValue).map(([k, v]) => ({ key: k, value: v }))
      : [{ key: "", value: "" }];
  const [rows, setRows] = useState<Row[]>(initial);

  const addRow = () => setRows((r) => [...r, { key: "", value: "" }]);
  const removeRow = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));
  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  // Serialise to JSON. Drop rows whose key is whitespace-only.
  const json = JSON.stringify(
    Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])
    )
  );

  const listId = `${name}-spec-keys`;

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {label}
          </h3>
          {hint && (
            <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{hint}</p>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-gray-400">
          {rows.filter((r) => r.key.trim()).length} entries
        </span>
      </div>

      <input type="hidden" name={name} value={json} readOnly />

      {suggestedKeys && suggestedKeys.length > 0 && (
        <datalist id={listId}>
          {suggestedKeys.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              placeholder="Spec name (e.g. Brand)"
              value={row.key}
              onChange={(e) => updateRow(i, { key: e.target.value })}
              list={suggestedKeys && suggestedKeys.length > 0 ? listId : undefined}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
            <input
              type="text"
              placeholder="Value (e.g. Carrier)"
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-red-950/30"
              aria-label="Remove spec row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Add specification
        </button>
      </div>
    </div>
  );
}

/** Common spec keys used at series level (shared across variants). */
export const SERIES_SPEC_SUGGESTIONS = [
  "Brand",
  "Type",
  "Voltage",
  "Refrigerant",
  "EER",
  "Warranty",
  "Energy Rating",
  "Coverage Area",
];

/** Common spec keys used at variant level (size-specific). */
export const VARIANT_SPEC_SUGGESTIONS = [
  "Capacity",
  "Cooling Capacity",
  "Heating Capacity",
  "Noise Level",
  "Dimensions",
  "Weight",
  "Power Consumption",
];
