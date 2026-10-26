const toMonthIndex = (value: string): number => {
  const [year, month] = value.split('-').map(Number)
  return (year ?? 0) * 12 + (month ?? 1) - 1
}

// Exclusive month difference between 'YYYY-MM' strings (null end = now), minimum 1.
const currentMonthIndex = (now: Date): number => now.getFullYear() * 12 + now.getMonth()

export const monthsBetween = (start: string, end: string | null, now?: Date): number => {
  const endIndex = end === null ? currentMonthIndex(now ?? new Date()) : toMonthIndex(end)
  return Math.max(1, endIndex - toMonthIndex(start))
}

export const formatRange = (
  start: string | number,
  end: string | number | null,
  presentLabel: string
): string => `${start} → ${end ?? presentLabel}`
