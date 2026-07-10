import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function fmtNumber(v: number, opts?: Intl.NumberFormatOptions) {
  return v.toLocaleString("pt-BR", opts);
}

export function fmtPercent(v: number, digits = 0) {
  return `${v.toFixed(digits).replace(".", ",")}%`;
}

export function fmtTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function initials(name: string) {
  const parts = name
    .replace(/^(Dra?\.|Sr\.|Sra\.)\s*/i, "")
    .split(" ")
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function fmtDateShort(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocal(d: Date | string | null) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function fmtMonthYear(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}
