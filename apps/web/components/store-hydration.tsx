"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export function StoreHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);
  return null;
}
