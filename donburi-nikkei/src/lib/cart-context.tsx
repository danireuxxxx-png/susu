"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { itemPorId } from "@/lib/data/menu";
import { restaurant } from "@/lib/data/restaurant";
import type { CartLine } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "donburi-cart";

interface CartContextValue {
  linhas: CartLine[];
  totalItens: number;
  subtotal: number;
  adicionar: (itemId: string, quantidade: number, observacao?: string) => void;
  remover: (itemId: string) => void;
  alterarQuantidade: (itemId: string, quantidade: number) => void;
  limpar: () => void;
  linkWhatsapp: () => string;
  cartAberto: boolean;
  abrirCart: () => void;
  fecharCart: () => void;
  ultimoAdicionado: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [linhas, setLinhas] = useState<CartLine[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [cartAberto, setCartAberto] = useState(false);
  const [ultimoAdicionado, setUltimoAdicionado] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hidratação única do carrinho a partir do localStorage após montar no cliente.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLinhas(JSON.parse(raw));
    } catch {
      // localStorage indisponível — segue com carrinho vazio
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(linhas));
  }, [linhas, hidratado]);

  const adicionar = useCallback(
    (itemId: string, quantidade: number, observacao?: string) => {
      setLinhas((prev) => {
        const existente = prev.find((l) => l.itemId === itemId && !l.observacao && !observacao);
        if (existente) {
          return prev.map((l) =>
            l === existente ? { ...l, quantidade: l.quantidade + quantidade } : l
          );
        }
        return [...prev, { itemId, quantidade, observacao }];
      });
      setUltimoAdicionado(itemId);
      window.setTimeout(() => setUltimoAdicionado(null), 1200);
    },
    []
  );

  const remover = useCallback((itemId: string) => {
    setLinhas((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const alterarQuantidade = useCallback((itemId: string, quantidade: number) => {
    setLinhas((prev) => {
      if (quantidade <= 0) return prev.filter((l) => l.itemId !== itemId);
      return prev.map((l) => (l.itemId === itemId ? { ...l, quantidade } : l));
    });
  }, []);

  const limpar = useCallback(() => setLinhas([]), []);

  const subtotal = useMemo(
    () =>
      linhas.reduce((acc, linha) => {
        const item = itemPorId(linha.itemId);
        return acc + (item?.preco ?? 0) * linha.quantidade;
      }, 0),
    [linhas]
  );

  const totalItens = useMemo(
    () => linhas.reduce((acc, l) => acc + l.quantidade, 0),
    [linhas]
  );

  const linkWhatsapp = useCallback(() => {
    const partes = linhas.map((linha) => {
      const item = itemPorId(linha.itemId);
      if (!item) return "";
      const obs = linha.observacao ? ` (obs: ${linha.observacao})` : "";
      return `• ${linha.quantidade}x ${item.nome}${obs} — ${formatCurrency(item.preco * linha.quantidade)}`;
    });
    const texto = [
      `Olá! Gostaria de fazer o seguinte pedido no ${restaurant.nomeCompleto}:`,
      "",
      ...partes,
      "",
      `Total: ${formatCurrency(subtotal)}`,
    ].join("\n");
    return `https://wa.me/${restaurant.telefoneWhatsapp}?text=${encodeURIComponent(texto)}`;
  }, [linhas, subtotal]);

  const value: CartContextValue = {
    linhas,
    totalItens,
    subtotal,
    adicionar,
    remover,
    alterarQuantidade,
    limpar,
    linkWhatsapp,
    cartAberto,
    abrirCart: () => setCartAberto(true),
    fecharCart: () => setCartAberto(false),
    ultimoAdicionado,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
