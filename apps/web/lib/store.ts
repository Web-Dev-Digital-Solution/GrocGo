'use client';

import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId?: string | null;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface AuthState {
  user: User | null;
  store: Store | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, store: Store | null, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  store: null,
  token: null,
  isLoading: true,

  setAuth: (user, store, token) => {
    localStorage.setItem('grocgo_token', token);
    localStorage.setItem('grocgo_user', JSON.stringify(user));
    if (store) localStorage.setItem('grocgo_store', JSON.stringify(store));
    set({ user, store, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('grocgo_token');
    localStorage.removeItem('grocgo_user');
    localStorage.removeItem('grocgo_store');
    set({ user: null, store: null, token: null, isLoading: false });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }
    try {
      const token = localStorage.getItem('grocgo_token');
      const userStr = localStorage.getItem('grocgo_user');
      const storeStr = localStorage.getItem('grocgo_store');

      if (token && userStr) {
        set({
          user: JSON.parse(userStr),
          store: storeStr ? JSON.parse(storeStr) : null,
          token,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// ─── ORDER CART STORE ────────────────────────────────────────
export interface CartItem {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setCustomerInfo: (info: Partial<Pick<CartState, 'customerName' | 'customerPhone' | 'customerAddress' | 'notes'>>) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  notes: '',

  addItem: (item) => set((s) => {
    // Check if product already in cart
    const existingIdx = s.items.findIndex(
      (i) => i.productId === item.productId || i.productName === item.productName
    );
    if (existingIdx >= 0) {
      const updated = [...s.items];
      updated[existingIdx].quantity += item.quantity;
      return { items: updated };
    }
    return { items: [...s.items, item] };
  }),

  removeItem: (index) => set((s) => ({
    items: s.items.filter((_, i) => i !== index),
  })),

  updateQuantity: (index, quantity) => set((s) => {
    if (quantity <= 0) return { items: s.items.filter((_, i) => i !== index) };
    const updated = [...s.items];
    updated[index].quantity = quantity;
    return { items: updated };
  }),

  setCustomerInfo: (info) => set(info),

  clearCart: () => set({ items: [], customerName: '', customerPhone: '', customerAddress: '', notes: '' }),

  total: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
}));
