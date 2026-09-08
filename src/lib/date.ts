import { format, type FormatOptions } from 'date-fns'

/**
 * Convert a UTC date or date string into local time with a specific format.
 *
 * @param input - A Date object or UTC date string
 * @param formatStr - date-fns format string (default: "MMM dd, yyyy hh:mm a")
 * @param options - date-fns format options
 * @returns Formatted local time string (e.g. "Dec 15, 2025 02:24 PM")
 */
const utcToLocal = (
  input: Date | string,
  formatStr: string = 'MMM dd, yyyy hh:mm a',
  options?: FormatOptions
): string => {
  const date = typeof input === 'string' ? new Date(input) : input

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input')
  }

  return format(date, formatStr, options)
}

/**
 * Convert a local Date or local date string into a UTC ISO string.
 *
 * @param input - A Date object or local date string
 * @returns UTC ISO string (e.g. "2025-12-15T14:24:00.000Z")
 */
const localToUtc = (input: Date | string): string => {
  const date = typeof input === 'string' ? new Date(input) : input

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input')
  }

  return date.toISOString()
}

/**
 * Format for display, falling back to an em dash for null/invalid input.
 *
 * @param input - A Date, date string, or null
 * @param formatStr - date-fns format string
 * @returns Formatted date, or "—"
 */
const formatOrDash = (
  input: Date | string | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string => {
  if (!input) return '—'
  try {
    return utcToLocal(input, formatStr)
  } catch {
    return '—'
  }
}

/**
 * Convert a date into the `yyyy-MM-dd` value an `<input type="date">` expects.
 *
 * Uses local date parts rather than `toISOString()`, which would shift to UTC
 * first — for a user east of UTC that renders 1990-01-01 as 1989-12-31 and
 * round-trips the wrong date on save.
 *
 * @param input - A Date, date string, or null
 * @returns `yyyy-MM-dd`, or an empty string when absent/invalid
 */
const toDateInputValue = (input: Date | string | null | undefined): string => {
  if (!input) return ''
  const parsed = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(parsed.getTime())) return ''

  const year = String(parsed.getFullYear()).padStart(4, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const date = { utcToLocal, localToUtc, formatOrDash, toDateInputValue }
