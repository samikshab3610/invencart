import { create } from 'zustand';

// Holds the cart item count shown in the navbar badge.
// We keep this separate from the full cart data (which React Query handles)
// because the badge needs to be visible on every page.
interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,

  // Set exact count — called when cart data is fetched
  setItemCount: (count) => set({ itemCount: count }),

  // Called when an item is added to cart
  incrementCount: () => set((state) => ({ itemCount: state.itemCount + 1 })),

  // Called when an item is removed from cart
  decrementCount: () =>
    set((state) => ({ itemCount: Math.max(0, state.itemCount - 1) })),

  // Called after logout or order placement (cart cleared)
  resetCount: () => set({ itemCount: 0 }),
}));