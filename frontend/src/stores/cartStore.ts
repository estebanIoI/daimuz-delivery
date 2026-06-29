import { create } from 'zustand';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.product_id === item.product_id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.product_id !== productId) });
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
