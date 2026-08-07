import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenHash(hash: string, chars = 4): string {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function formatUsdcAmount(amount: number | string): string {
  if (amount === null || amount === undefined || amount === "") return "$0.00";
  const strVal = typeof amount === "string" ? amount.replace(/[^0-9.-]+/g, "") : String(amount);
  const num = parseFloat(strVal);
  if (isNaN(num) || num === 0) return "$0.00";

  // Smart 2-Decimal Display (with 4-decimal fallback for micro-amounts < $0.01)
  const decimals = num > 0 && num < 0.01 ? 4 : 2;
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/,/g, "")) || 0;
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatRelativeTime(isoOrRelative: string): string {
  if (!isoOrRelative) return "recently";
  if (isoOrRelative.includes("ago") || isoOrRelative.includes("now")) {
    return isoOrRelative;
  }
  const d = new Date(isoOrRelative);
  if (isNaN(d.getTime())) return isoOrRelative;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function parsePrice(price: string): number {
  if (price.toLowerCase() === "free") return 0;
  const match = price.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

export function parseDownloads(downloads: string): number {
  const clean = downloads.toUpperCase().trim();
  if (clean.endsWith("M")) {
    return parseFloat(clean.replace("M", "")) * 1_000_000;
  }
  if (clean.endsWith("K")) {
    return parseFloat(clean.replace("K", "")) * 1_000;
  }
  return parseFloat(clean) || 0;
}

export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/i.test(address);
}
