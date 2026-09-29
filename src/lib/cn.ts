import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind classes safely.
 * 1. clsx: conditional logic (e.g. { hidden: !open })
 * 2. twMerge: conflict resolution (e.g. 'px-2' + 'px-4' -> 'px-4')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
