'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CARTA_ITEMS_DEMO } from '@/lib/mock/carta';

/**
 * Carrito demo de la carta in-venue. Estado client-only persistido en
 * sessionStorage (una noche = una sesión). Cuando exista el backend de
 * pedidos, este provider se conecta a lib/api/ (crear/actualizar pedido).
 */

export interface CartLine {
  itemId: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  add: (itemId: string, quantity?: number) => void;
  remove: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  totalSoles: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const priceOf = (itemId: string) =>
  CARTA_ITEMS_DEMO.find((i) => i.id === itemId)?.priceSoles ?? 0;

export function CartProvider({ localSlug, children }: { localSlug: string; children: ReactNode }) {
  const storageKey = `urnight.carta.${localSlug}`;
  const [lines, setLines] = useState<CartLine[]>([]);

  // Hidratar desde sessionStorage tras montar (evita mismatch SSR).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* storage bloqueado: el carrito vive solo en memoria */
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      /* noop */
    }
  }, [lines, storageKey]);

  const add = useCallback((itemId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === itemId);
      if (existing) {
        return prev.map((l) =>
          l.itemId === itemId ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { itemId, quantity }];
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.itemId !== itemId)
        : prev.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const totalSoles = lines.reduce((sum, l) => sum + l.quantity * priceOf(l.itemId), 0);
    return { lines, add, remove, setQuantity, clear, count, totalSoles };
  }, [lines, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
