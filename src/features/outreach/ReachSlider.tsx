import { Slider } from "@/components/ui/slider"

const NUMBER = new Intl.NumberFormat("en-GB")

/** Contacts per notch. Even the whole way up, unlike the company-size scale:
 * an allowance is a quantity being divided rather than an order of magnitude
 * being found, and 10 is the granularity anyone allocates in. */
const STEP = 10

interface ReachSliderProps {
  /** Contacts allocated, or null when nothing has been decided yet. */
  value: number | null
  onChange: (next: number) => void
  /** The most this campaign can take — what is left of the seat's allowance. */
  max: number
  disabled?: boolean
  id?: string
}

/** Single-handle allocation of the sender's monthly reach. */
export function ReachSlider({
  value,
  onChange,
  max,
  disabled,
  id,
}: ReachSliderProps) {
  const ceiling = Math.max(max, STEP)
  // A stored figure above the ceiling (an allowance that shrank, say) still
  // shows where it is rather than snapping the handle to the end.
  const current = Math.min(Math.max(value ?? 0, 0), ceiling)

  return (
    <div className="space-y-3">
      <Slider
        id={id}
        value={[current]}
        min={0}
        max={ceiling}
        step={STEP}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
        aria-label="Contacts this campaign may reach"
        aria-valuetext={`${NUMBER.format(current)} contacts`}
        className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-track]]:h-3"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>{NUMBER.format(ceiling)}</span>
      </div>
    </div>
  )
}
