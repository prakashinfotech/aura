import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  items: Set<string>;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: new Set<string>(),

      toggle: (productId) =>
        set((state) => {
          const next = new Set(state.items);
          if (next.has(productId)) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return { items: next };
        }),

      has: (productId) => get().items.has(productId),

      clear: () => set({ items: new Set() }),
    }),
    {
      name: "Aura-wishlist",
      skipHydration: true,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str) as { state: { items: string[] } };
          return { state: { items: new Set(parsed.state.items) } };
        },
        setItem: (name, value) => {
          const serialized = JSON.stringify({
            state: { items: Array.from(value.state.items) },
          });
          localStorage.setItem(name, serialized);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
