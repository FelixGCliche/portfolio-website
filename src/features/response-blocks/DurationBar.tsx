export type DurationBarProps = {
  months: number
  // Months that fill the bar; defaults to 12
  max?: number
}

// Decorative: the adjacent tag carries the value
export const DurationBar = (props: DurationBarProps) => (
  <span class="bg-border inline-block h-1 w-24 flex-none" aria-hidden="true">
    <span
      class="bg-muted-foreground block h-full"
      style={{ width: `${Math.min(Math.max(props.months, 0) / (props.max ?? 12), 1) * 100}%` }}
    />
  </span>
)
