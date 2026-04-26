import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Calculates estimated read time based on word count (~200 wpm). */
export function calcReadTime(text: string | null | undefined): string {
  if (!text) return '< 1 Min.';
  const plain = text.replace(/<[^>]*>/g, '');
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 200) * 60);
  if (seconds < 60) return `${Math.max(10, seconds)} Sek.`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} Min.`;
}
