import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone utilities: keep the frontend consistent with backend/DB (Singapore)
export const TIME_ZONE = 'Asia/Singapore'
export const SGT_OFFSET = '+08:00'

/**
 * Ensure an ISO-like datetime string contains a timezone offset.
 * If the input already contains a 'Z' or an offset, returns unchanged.
 * Otherwise, appends the Singapore offset (+08:00).
 */
export function ensureSgtOffset(isoOrTime: string | null | undefined): string | null {
  if (!isoOrTime) return null
  // crude check for timezone designator Z or +HH or -HH
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(isoOrTime)) return isoOrTime
  return `${isoOrTime}${SGT_OFFSET}`
}

/**
 * Return true if the provided datetime string already contains a timezone
 * designator (Z or +HH:MM / -HH:MM) to avoid appending another offset.
 */
export function hasTz(isoOrTime: string | null | undefined): boolean {
  if (!isoOrTime) return false
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(isoOrTime)
}
