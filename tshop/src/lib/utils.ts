import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** R$ 9.999 — whole reais, for headline prices. */
export const formatPrice = (value: number) => brl.format(value);

/** R$ 833,25 — with cents, for instalments. */
export const formatPriceExact = (value: number) => brlCents.format(value);

/** "12x de R$ 833,25" */
export const formatInstallment = (total: number, count: number) =>
  `${count}x de ${formatPriceExact(total / count)}`;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
