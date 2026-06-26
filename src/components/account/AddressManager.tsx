"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Trash2, Plus, Check, X, Star } from "lucide-react";
import { AddressFields } from "@/components/address/AddressFields";
import {
  addAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  type AddressResult,
} from "@/lib/actions/addresses";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { SavedAddress } from "@/db/schema";

const initial: AddressResult = { success: true };

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const { lang } = useLanguage();
  const th = lang === "th";
  const router = useRouter();
  // null = nothing open, "add" = add form, otherwise the id being edited.
  const [open, setOpen] = useState<null | "add" | string>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<AddressResult>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{th ? "ที่อยู่ของฉัน" : "My addresses"}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {th ? "ใช้ตอนสั่งซื้อและจองบริการ" : "Used at checkout and when booking a service."}
          </p>
        </div>
        {open !== "add" && (
          <button
            type="button"
            onClick={() => setOpen("add")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {th ? "เพิ่มที่อยู่" : "Add address"}
          </button>
        )}
      </div>

      {/* Add form */}
      {open === "add" && (
        <AddressFormCard mode="add" onDone={() => setOpen(null)} />
      )}

      {addresses.length === 0 && open !== "add" ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
          {th ? "ยังไม่มีที่อยู่ที่บันทึกไว้" : "No saved addresses yet."}
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) =>
            open === a.id ? (
              <li key={a.id}>
                <AddressFormCard mode="edit" address={a} onDone={() => setOpen(null)} />
              </li>
            ) : (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 p-4"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{a.addressLine1}</p>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        {th ? "ค่าเริ่มต้น" : "Default"}
                      </span>
                    )}
                  </div>
                  {a.addressLine2 && <p className="text-xs text-gray-500">{a.addressLine2}</p>}
                  <p className="text-xs text-gray-500">
                    {a.city}, {a.province} {a.postalCode}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setOpen(a.id)}
                      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                    >
                      <Pencil className="h-3 w-3" />
                      {th ? "แก้ไข" : "Edit"}
                    </button>
                    {!a.isDefault && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () => setDefaultAddressAction(a.id),
                            th ? "ตั้งเป็นค่าเริ่มต้นแล้ว" : "Set as default"
                          )
                        }
                        className="font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50"
                      >
                        {th ? "ตั้งเป็นค่าเริ่มต้น" : "Set as default"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        run(
                          () => deleteAddressAction(a.id),
                          th ? "ลบที่อยู่แล้ว" : "Address removed"
                        )
                      }
                      className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      {th ? "ลบ" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

// ── Inline add/edit form ──────────────────────────────────────────────────────
function AddressFormCard({
  mode,
  address,
  onDone,
}: {
  mode: "add" | "edit";
  address?: SavedAddress;
  onDone: () => void;
}) {
  const { lang } = useLanguage();
  const th = lang === "th";
  const router = useRouter();
  const action = mode === "add" ? addAddressAction : updateAddressAction;
  const [state, formAction, isPending] = useActionState(action, initial);
  const submitted = useRef(false);

  useEffect(() => {
    if (!submitted.current || isPending) return;
    if (state.success) {
      toast.success(th ? "บันทึกที่อยู่แล้ว" : "Address saved");
      submitted.current = false;
      onDone();
      router.refresh();
    }
  }, [state, isPending, onDone, router, th]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <form
      action={(fd) => {
        submitted.current = true;
        formAction(fd);
      }}
      className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-4"
    >
      {mode === "edit" && address && <input type="hidden" name="id" value={address.id} />}
      <AddressFields defaultValues={address} errors={fieldErrors} disabled={isPending} />
      {globalError && <p className="text-xs text-red-600">{globalError}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {isPending ? (th ? "กำลังบันทึก…" : "Saving…") : th ? "บันทึก" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          {th ? "ยกเลิก" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
