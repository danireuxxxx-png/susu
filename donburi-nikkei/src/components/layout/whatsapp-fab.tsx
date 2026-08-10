"use client";

import { MessageCircle } from "lucide-react";
import { restaurant } from "@/lib/data/restaurant";
import { useCart } from "@/lib/cart-context";

export function WhatsappFab() {
  const { cartAberto } = useCart();

  if (cartAberto) return null;

  const link = `https://wa.me/${restaurant.telefoneWhatsapp}?text=${encodeURIComponent(
    `Olá! Vim pelo site do ${restaurant.nomeCompleto} e gostaria de fazer um pedido.`
  )}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Pedir pelo WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 md:bottom-8 md:right-8"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring" />
      <MessageCircle className="relative h-5 w-5" />
      <span className="relative hidden text-sm font-semibold sm:inline">
        Pedir no WhatsApp
      </span>
    </a>
  );
}
