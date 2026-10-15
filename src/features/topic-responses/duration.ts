const toMonthIndex = (value: string): number => {
  const [year, month] = value.split('-').map(Number)
  return (year ?? 0) * 12 + (month ?? 1) - 1
}

// Inclusive month count between 'YYYY-MM' strings (null end = now): both end months count.
const currentMonthIndex = (now: Date): number => now.getFullYear() * 12 + now.getMonth()

export const monthsBetween = (start: string, end: string | null, now?: Date): number => {
  const endIndex = end === null ? currentMonthIndex(now ?? new Date()) : toMonthIndex(end)
  return Math.max(1, endIndex - toMonthIndex(start) + 1)
}

export const formatRange = (start: string, end: string | null, presentLabel: string): string =>
  `${start} → ${end ?? presentLabel}`
