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

export const date = { utcToLocal, localToUtc }
