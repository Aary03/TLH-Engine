import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number, decimals = 0): string {
  if (Math.abs(amount) >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  }
  if (Math.abs(amount) >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function daysBetween(date1: Date, date2: Date): number {
  return Math.floor(
    Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function holdingPeriodLabel(days: number): string {
  if (days >= 730) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
  if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
  return `${days}d`;
}

export function daysUntilLTCG(purchaseDate: Date): number {
  const today = new Date();
  const ltcgDate = new Date(purchaseDate);
  ltcgDate.setDate(ltcgDate.getDate() + 730);
  return Math.max(0, Math.floor((ltcgDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}
