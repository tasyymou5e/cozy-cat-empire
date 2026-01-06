import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique identifier string
 * 
 * @returns A unique ID string combining timestamp and random characters
 * 
 * @example
 * ```ts
 * const id = generateId(); // "lxyz123abc"
 * ```
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
