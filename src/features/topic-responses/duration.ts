const toMonthIndex = (value: string): number => {
  const [year, month] = value.split('-').map(Number)
  return (year ?? 0) * 12 + (month ?? 1) - 1
}

// Exclusive month difference between 'YYYY-MM' strings (null end = now), minimum 1.
export const monthsBetween = (
  start: string,
  end: string | null,
  now: Date = new Date()
): number => {
  const endIndex = end === null ? now.getFullYear() * 12 + now.getMonth() : toMonthIndex(end)
  return Math.max(1, endIndex - toMonthIndex(start))
}

export const formatRange = (start: string, end: string | null, presentLabel: string): string =>
  `${start} → ${end ?? presentLabel}`
