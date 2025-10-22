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

/**
 * Convert a Singapore-local datetime (possibly missing timezone) to a UTC ISO string (Z)
 * If the input already contains a timezone or Z, it will be parsed and converted to UTC.
 * Examples:
 *  - '2024-01-01T09:00:00' -> '2024-01-01T01:00:00.000Z' (assumes +08:00)
 *  - '2024-01-01T09:00:00+08:00' -> '2024-01-01T01:00:00.000Z'
 *  - '2024-01-01T01:00:00Z' -> '2024-01-01T01:00:00.000Z'
 */
export function sgtLocalToUtcIso(isoOrTime: string | null | undefined): string | null {
  if (!isoOrTime) return null
  try {
    // If it already has timezone info, let Date parse it and convert to UTC
    if (hasTz(isoOrTime)) {
      const d = new Date(isoOrTime)
      if (isNaN(d.getTime())) return null
      return d.toISOString()
    }

    // Otherwise assume the string is Asia/Singapore local (no DST) and append SGT offset
    const withOffset = `${isoOrTime}${SGT_OFFSET}`
    const d = new Date(withOffset)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch (e) {
    return null
  }
}

/**
 * Format a UTC ISO string into a locale string in Asia/Singapore timezone using Intl.
 * Returns null for invalid inputs.
 */
export function utcIsoToSgTime(utcIso: string | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  if (!utcIso) return null
  try {
    const d = new Date(utcIso)
    if (isNaN(d.getTime())) return null
    const fmt = new Intl.DateTimeFormat('en-SG', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false, ...options })
    return fmt.format(d)
  } catch (e) {
    return null
  }
}
