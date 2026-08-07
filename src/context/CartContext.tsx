import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product } from '@/lib/supabase';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  coupon: string | null;
  discount: number;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string | null, amount: number) => void;
  subtotal: number;
  gstTotal: number;
  totalItems: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setDiscount(0);
  }, []);

  const applyCoupon = useCallback((code: string | null, amount: number) => {
    setCoupon(code);
    setDiscount(amount);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const gstTotal = items.reduce(
    (s, i) => s + (i.product.price * i.quantity * i.product.gst_percent) / 100,
    0
  );
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, coupon, discount, add, remove, setQty, clear, applyCoupon, subtotal, gstTotal, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
