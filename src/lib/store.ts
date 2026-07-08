import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  cabineId?: string;
  cabineToken?: string;
  actionCount?: number;
  isLoyal?: boolean;
  loyaltyTier?: string;
}

export interface CartItem {
  id: string;
  type: 'flash' | 'card'; // flash product or physical card
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  operator?: string;
  productId?: string; // for flash products
  cardId?: string; // for physical cards
}

interface AppState {
  user: User | null;
  isAdmin: boolean;
  isCabineManager: boolean;
  isLoyalClient: boolean;
  activeSection: string;
  legalPage: string | null;
  authLoading: boolean;
  cart: CartItem[];
  cartOpen: boolean;

  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setActiveSection: (section: string) => void;
  setLegalPage: (page: string | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  cartTotal: () => number;
  cartItemCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAdmin: false,
  isCabineManager: false,
  isLoyalClient: false,
  activeSection: 'home',
  legalPage: null,
  authLoading: true,
  cart: [],
  cartOpen: false,

  setUser: (user) =>
    set({
      user,
      isAdmin: user?.role === 'ADMIN',
      isCabineManager: user?.role === 'CABINE_MANAGER',
      isLoyalClient: user?.role === 'LOYAL_CLIENT' || user?.isLoyal === true || (user?.loyaltyTier && user.loyaltyTier !== 'NONE'),
    }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    set({
      user: null,
      isAdmin: false,
      isCabineManager: false,
      isLoyalClient: false,
      activeSection: 'home',
      legalPage: null,
      cart: [],
    });
  },

  checkSession: async () => {
    set({ authLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        set({
          user,
          isAdmin: user.role === 'ADMIN',
          isCabineManager: user.role === 'CABINE_MANAGER',
          isLoyalClient: user.role === 'LOYAL_CLIENT' || user.isLoyal === true || (user.loyaltyTier && user.loyaltyTier !== 'NONE'),
          authLoading: false,
        });
      } else {
        set({
          user: null,
          isAdmin: false,
          isCabineManager: false,
          isLoyalClient: false,
          authLoading: false,
        });
      }
    } catch {
      set({ authLoading: false });
    }
  },

  setActiveSection: (section) => set({ activeSection: section, legalPage: null }),
  setLegalPage: (page) => set({ legalPage: page }),

  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find(c => c.id === item.id && c.type === item.type);
    if (existing) {
      set({
        cart: cart.map(c =>
          c.id === item.id && c.type === item.type
            ? { ...c, quantity: c.quantity + item.quantity }
            : c
        ),
      });
    } else {
      set({ cart: [...cart, item] });
    }
    set({ cartOpen: true });
  },

  removeFromCart: (id) => {
    set({ cart: get().cart.filter(c => c.id !== id) });
  },

  updateCartQuantity: (id, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter(c => c.id !== id) });
    } else {
      set({
        cart: get().cart.map(c =>
          c.id === id ? { ...c, quantity } : c
        ),
      });
    }
  },

  clearCart: () => set({ cart: [] }),
  setCartOpen: (open) => set({ cartOpen: open }),

  cartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  cartItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
