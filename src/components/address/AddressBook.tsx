"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Check } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AddressFields } from "@/components/address/AddressFields";
import type { SavedAddress } from "@/db/schema";

type Props = {
  addresses: SavedAddress[];
  /** Field errors from a failed parent-form submit (shown in form mode). */
  fieldErrors?: Partial<Record<keyof SavedAddress, string[] | undefined>>;
};

/**
 * Address picker for checkout / booking. Shows the customer's saved addresses
 * as selectable cards; the chosen one is submitted via hidden inputs. "Use a
 * new address" / "Edit" reveals the editable fields (used for this order only —
 * the address book is managed on the account page).
 */
export function AddressBook({ addresses, fieldErrors }: Props) {
  const { lang } = useLanguage();
  const th = lang === "th";

  const defaultId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  // "select" shows the cards; "form" shows editable fields.
  const [mode, setMode] = useState<"select" | "form">(
    addresses.length > 0 ? "select" : "form"
  );
  // When editing a card we prefill the fields; "new" starts blank.
  const [editValues, setEditValues] = useState<SavedAddress | null>(null);

  const selected = addresses.find((a) => a.id === selectedId) ?? null;

  if (mode === "form") {
    return (
      <div className="space-y-4">
        <AddressFields
          key={editValues?.id ?? "new"}
          defaultValues={editValues ?? undefined}
          errors={fieldErrors}
        />
        {addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setMode("select")}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← {th ? "เลือกจากที่อยู่ที่บันทึกไว้" : "Choose a saved address"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map((a) => {
          const active = a.id === selectedId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedId(a.id)}
              className={`relative rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.addressLine1}</p>
                  {a.addressLine2 && (
                    <p className="text-xs text-gray-500">{a.addressLine2}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {a.city}, {a.province} {a.postalCode}
                  </p>
                  {a.isDefault && (
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {th ? "ค่าเริ่มต้น" : "Default"}
                    </span>
                  )}
                </div>
              </div>

              {active && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditValues(a);
                  setMode("form");
                }}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Pencil className="h-3 w-3" />
                {th ? "แก้ไข" : "Edit"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          setEditValues(null);
          setMode("form");
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        {th ? "ใช้ที่อยู่ใหม่" : "Use a new address"}
      </button>

      {/* Submit the selected address via hidden inputs. */}
      {selected && (
        <>
          <input type="hidden" name="addressLine1" value={selected.addressLine1} />
          <input type="hidden" name="addressLine2" value={selected.addressLine2 ?? ""} />
          <input type="hidden" name="city" value={selected.city} />
          <input type="hidden" name="province" value={selected.province} />
          <input type="hidden" name="postalCode" value={selected.postalCode} />
        </>
      )}
    </div>
  );
}
