import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RANGE_PRESETS,
  matchPreset,
  presetRange,
  type DateRange,
  type RangePreset,
} from "@/lib/dateRanges"

/** The value the picker shows when the dates match no preset. */
const CUSTOM = "custom"

/**
 * The period a report covers: a shortcut, and the two dates it resolves to.
 *
 * Both, rather than either. The shortcuts are how a range is almost always
 * chosen ("last quarter"), and the dates are how it is checked — a picker that
 * only says "this month" leaves the reader working out whether that includes
 * today. Typing a date simply moves the shortcut to Custom; the two controls
 * are one value seen two ways.
 */
export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (next: DateRange) => void
}) {
  const preset = matchPreset(value) ?? CUSTOM

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={preset}
        onValueChange={(next) => onChange(presetRange(next as RangePreset))}
      >
        <SelectTrigger className="w-40" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* Only offered once the dates have stopped matching a shortcut —
            * "Custom" is a description of where you are, not somewhere to go. */}
          {preset === CUSTOM && (
            <SelectItem value={CUSTOM} disabled>
              Custom
            </SelectItem>
          )}
          {RANGE_PRESETS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-[9.5rem]"
        aria-label="From"
        value={value.from}
        max={value.to}
        onChange={(e) =>
          e.target.value &&
          onChange({
            from: e.target.value,
            // A start after the end is not a range; the end follows it rather
            // than the field refusing what was typed.
            to: e.target.value > value.to ? e.target.value : value.to,
          })
        }
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        className="w-[9.5rem]"
        aria-label="To"
        value={value.to}
        min={value.from}
        onChange={(e) =>
          e.target.value &&
          onChange({
            from: e.target.value < value.from ? e.target.value : value.from,
            to: e.target.value,
          })
        }
      />
    </div>
  )
}
