"use client";

import type { MenuProductResponse } from "@urnight/contracts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { consumirCreditoDemo, leerCreditoDemo } from "@/lib/mock/credito";

/**
 * Carrito de la carta in-venue. Persiste solo durante la sesión de la noche y
 * calcula sus montos con los productos vigentes que entrega el API.
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
  totalAmount: number;
  currency: string;
  walletBalance: number;
  productFor: (itemId: string) => MenuProductResponse | undefined;
  debitDemoWallet: (amount: number) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  localSlug,
  products,
  children,
}: {
  localSlug: string;
  products: readonly MenuProductResponse[];
  children: ReactNode;
}) {
  const storageKey = `ravenue.carta.${localSlug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  // Hidratar desde sessionStorage tras montar (evita mismatch SSR).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as CartLine[];
      setLines(
        stored.filter(
          (line) =>
            typeof line.itemId === "string" &&
            Number.isInteger(line.quantity) &&
            line.quantity > 0 &&
            productsById.has(line.itemId),
        ),
      );
    } catch {
      /* storage bloqueado: el carrito vive solo en memoria */
    }
  }, [productsById, storageKey]);

  // Adaptador temporal de wallet: el saldo real reemplazará solo este punto.
  useEffect(() => {
    setWalletBalance(leerCreditoDemo(localSlug)?.saldo ?? 0);
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
          l.itemId === itemId
            ? { ...l, quantity: Math.min(100, l.quantity + quantity) }
            : l,
        );
      }
      return [...prev, { itemId, quantity: Math.min(100, quantity) }];
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.itemId !== itemId)
        : prev.map((l) =>
            l.itemId === itemId
              ? { ...l, quantity: Math.min(100, quantity) }
              : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, line) =>
      sum + line.quantity * (productsById.get(line.itemId)?.priceAmount ?? 0),
    0,
  );
  const currency =
    lines
      .map((line) => productsById.get(line.itemId)?.priceCurrency)
      .find(Boolean) ?? "PEN";
  const productFor = useCallback(
    (itemId: string) => productsById.get(itemId),
    [productsById],
  );

  const debitDemoWallet = useCallback((amount: number) => {
    const descontado = consumirCreditoDemo(localSlug, amount);
    setWalletBalance(leerCreditoDemo(localSlug)?.saldo ?? 0);
    return descontado;
  }, [localSlug]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      add,
      remove,
      setQuantity,
      clear,
      count,
      totalAmount,
      currency,
      walletBalance,
      productFor,
      debitDemoWallet,
    }),
    [
      lines,
      add,
      remove,
      setQuantity,
      clear,
      count,
      totalAmount,
      currency,
      walletBalance,
      productFor,
      debitDemoWallet,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
