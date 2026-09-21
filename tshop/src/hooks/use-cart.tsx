"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "tshop.cart.v1";
/** Orders above this total ship free — mirrored in the drawer copy. */
export const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING = 39.9;

type State = { lines: CartLine[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "remove"; id: string }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "clear" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };

    case "add": {
      const existing = state.lines.find((l) => l.id === action.line.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.id === action.line.id
              ? { ...l, quantity: Math.min(l.quantity + action.line.quantity, 10) }
              : l,
          ),
        };
      }
      return { ...state, lines: [...state.lines, action.line] };
    }

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };

    case "setQuantity":
      return {
        ...state,
        lines:
          action.quantity <= 0
            ? state.lines.filter((l) => l.id !== action.id)
            : state.lines.map((l) =>
                l.id === action.id ? { ...l, quantity: action.quantity } : l,
              ),
      };

    case "clear":
      return { ...state, lines: [] };
  }
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "id">) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** A cart line is identified by the exact configuration bought. */
const lineId = (line: Omit<CartLine, "id">) =>
  `${line.slug}::${line.color}::${line.storage}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);

  // Restore after mount so the server and first client render agree.
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) lines = parsed as CartLine[];
      }
    } catch {
      // Private mode, blocked storage, or corrupted JSON: start empty.
    }
    dispatch({ type: "hydrate", lines });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage unavailable — the cart still works for this session.
    }
  }, [state.lines, state.hydrated]);

  const add = useCallback((line: Omit<CartLine, "id">) => {
    dispatch({ type: "add", line: { ...line, id: lineId(line) } });
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0,
    );
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

    return {
      lines: state.lines,
      hydrated: state.hydrated,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      remove: (id) => dispatch({ type: "remove", id }),
      setQuantity: (id, quantity) =>
        dispatch({ type: "setQuantity", id, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state.lines, state.hydrated, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
