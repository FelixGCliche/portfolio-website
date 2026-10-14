export type DurationBarProps = {
  months: number
  // Months that fill the bar; defaults to 12
  max?: number
}

// Decorative: the adjacent tag carries the value
const fraction = (months: number, max?: number) => {
  const total = max && Number.isFinite(max) && max > 0 ? max : 12
  const ratio = Number.isFinite(months) ? months / total : 0
  return Math.min(Math.max(ratio, 0), 1)
}

export const DurationBar = (props: DurationBarProps) => (
  <span class="bg-border inline-block h-1 w-24 flex-none" aria-hidden="true">
    <span
      class="bg-muted-foreground block h-full"
      style={{ width: `${fraction(props.months, props.max) * 100}%` }}
    />
  </span>
)
