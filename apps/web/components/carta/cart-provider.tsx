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
import { consumirCreditoDemo, leerCreditoDemo } from '@/lib/mock/credito';

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
  creditoDisponible: number;
  totalTrasCredito: number;
  canjearCredito: () => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const priceOf = (itemId: string) =>
  CARTA_ITEMS_DEMO.find((i) => i.id === itemId)?.priceSoles ?? 0;

export function CartProvider({
  localSlug = 'nocturna-club',
  children,
}: {
  localSlug?: string;
  children: ReactNode;
}) {
  const storageKey = `ravenue.carta.${localSlug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [creditoDisponible, setCreditoDisponible] = useState(0);

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
    setCreditoDisponible(leerCreditoDemo(localSlug)?.saldo ?? 0);
  }, [localSlug]);

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

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalSoles = lines.reduce((sum, l) => sum + l.quantity * priceOf(l.itemId), 0);
  const totalTrasCredito = Math.max(0, totalSoles - creditoDisponible);

  const canjearCredito = useCallback(() => {
    const descontado = consumirCreditoDemo(localSlug, totalSoles);
    setCreditoDisponible(leerCreditoDemo(localSlug)?.saldo ?? 0);
    return descontado;
  }, [localSlug, totalSoles]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      add,
      remove,
      setQuantity,
      clear,
      count,
      totalSoles,
      creditoDisponible,
      totalTrasCredito,
      canjearCredito,
    }),
    [
      lines,
      add,
      remove,
      setQuantity,
      clear,
      count,
      totalSoles,
      creditoDisponible,
      totalTrasCredito,
      canjearCredito,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
