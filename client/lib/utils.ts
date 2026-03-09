import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function formatDateRange(startDate?: string, endDate?: string | null): string {
  const start = startDate ? formatDate(startDate) : '';
  const end = endDate ? formatDate(endDate) : 'Present';
  
  if (!startDate) return end;
  return `${start} - ${end}`;
}
