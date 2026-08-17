import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  image: string;
  size: string;
  color: string;
  price: number;
  mrp: number;
  qty: number;
  maxQty: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, qty: Math.min(i.qty + item.qty, i.maxQty) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQty: (variantId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, qty: Math.min(qty, i.maxQty) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: "Aura-cart", skipHydration: true }
  )
);
