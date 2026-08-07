import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  HEADCOUNT_MAX,
  HEADCOUNT_MIN,
  HEADCOUNT_STOPS,
  formatHeadcountShort,
  toStopIndex,
} from "./headcountScale"

/** Marks under the track. Evenly spaced by position, not by headcount — they
 * are a sense of travel, not a legend. */
const TICKS = 21

interface CompanySizeRangeProps {
  min: number
  max: number
  onChange: (range: { min: number; max: number }) => void
  disabled?: boolean
  id?: string
}

/**
 * Employee-count range: a typed min and max over a two-handle slider.
 *
 * The boxes and the slider are two ways at the same pair of numbers. Typing is
 * how you say "exactly 250"; dragging is how you find the shape of the range
 * when you do not yet know it. The slider moves over stop *indices* rather than
 * headcounts, which is what makes it progressive — the stops themselves get
 * further apart as they climb (see `headcountScale`).
 */
export function CompanySizeRange({
  min,
  max,
  onChange,
  disabled,
  id,
}: CompanySizeRangeProps) {
  // What is in the boxes while they are being typed in — held apart from the
  // range itself so a half-typed "1" on the way to "150" is not read as 1, and
  // so the box can be empty for a keystroke.
  const [text, setText] = useState({ min: String(min), max: String(max) })
  const [shown, setShown] = useState({ min, max })
  if (shown.min !== min || shown.max !== max) {
    // The range changed from outside the boxes (a drag): retype them.
    setShown({ min, max })
    setText({ min: String(min), max: String(max) })
  }

  const indices = useMemo(() => [toStopIndex(min), toStopIndex(max)], [min, max])

  /** Take what was typed, within the scale and the right way round. */
  function commit(edge: "min" | "max", raw: string) {
    const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10)
    const value = Math.min(
      Math.max(Number.isNaN(parsed) ? HEADCOUNT_MIN : parsed, HEADCOUNT_MIN),
      HEADCOUNT_MAX,
    )
    const next =
      edge === "min"
        ? { min: Math.min(value, max), max }
        : { min, max: Math.max(value, min) }
    setShown(next)
    setText({ min: String(next.min), max: String(next.max) })
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(["min", "max"] as const).map((edge) => (
          <div key={edge} className="space-y-1.5">
            <Label
              htmlFor={edge === "min" ? id : undefined}
              className="text-xs font-normal text-muted-foreground"
            >
              {edge === "min" ? "Min" : "Max"}
            </Label>
            <Input
              id={edge === "min" ? id : undefined}
              inputMode="numeric"
              disabled={disabled}
              value={text[edge]}
              aria-label={`${edge === "min" ? "Smallest" : "Largest"} company size`}
              onChange={(e) =>
                setText((current) => ({ ...current, [edge]: e.target.value }))
              }
              onBlur={(e) => commit(edge, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit(edge, e.currentTarget.value)
                }
              }}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Slider
          value={indices}
          min={0}
          max={HEADCOUNT_STOPS.length - 1}
          step={1}
          minStepsBetweenThumbs={1}
          disabled={disabled}
          onValueChange={([low, high]) =>
            onChange({ min: HEADCOUNT_STOPS[low], max: HEADCOUNT_STOPS[high] })
          }
          // A heavier track than the shared default: this one carries two
          // handles and a scale under it, so it reads as a ruler.
          className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-track]]:h-3"
          aria-label="Company size range"
        />
        <div
          aria-hidden
          className="flex items-end justify-between px-0.5 pt-0.5"
        >
          {Array.from({ length: TICKS }, (_, i) => (
            <span key={i} className="h-1.5 w-px bg-border" />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatHeadcountShort(HEADCOUNT_MIN)}</span>
          <span>{formatHeadcountShort(HEADCOUNT_MAX)}</span>
        </div>
      </div>
    </div>
  )
}
