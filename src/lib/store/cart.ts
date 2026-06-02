"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === incoming.productId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === incoming.productId
                ? { ...i, quantity: i.quantity + incoming.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, incoming] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: "ac-cart" }
  )
);

// Derived selectors (computed outside the store to avoid re-renders)
export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceInCents * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
