"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        const { items } = get();
        const existing = items.find((i) => i.variantId === incoming.variantId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.variantId === incoming.variantId
                ? { ...i, quantity: i.quantity + incoming.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, incoming] });
        }
      },

      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "ac-cart",
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as {
          items?: Array<Record<string, unknown>>;
        };
        const items = state.items ?? [];

        if (version < 3) {
          // v1 → v2: rename unitPriceInCents → unitPriceInSatang
          // v2 → v3: cart now keys by variantId; drop legacy items missing it
          //          (they no longer point at any addressable SKU).
          const migrated = items
            .map((item) => {
              const it = item as Record<string, unknown>;
              return {
                ...it,
                unitPriceInSatang:
                  (it.unitPriceInSatang as number | undefined) ??
                  (it.unitPriceInCents as number | undefined) ??
                  0,
              };
            })
            .filter(
              (item) => typeof (item as Record<string, unknown>).variantId === "string"
            );

          return { ...state, items: migrated } as unknown as CartState;
        }
        return state as unknown as CartState;
      },
    }
  )
);

// Derived selectors (computed outside the store to avoid re-renders)
export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceInSatang * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
