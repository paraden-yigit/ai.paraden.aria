import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { OutreachRun } from "@/types/outreach"
import { StepFrame } from "./StepFrame"

/**
 * The sequence step: how many emails, and how far apart.
 *
 * Every step after the first is sent as a *reply* in the opener's thread rather
 * than as a fresh email, which is why only the opener gets a subject line and
 * why the gaps are the only other thing to decide. Gaps are in working days: a
 * follow-up landing on a Sunday is a follow-up nobody reads.
 */

const TOUCH_OPTIONS = [
  {
    touches: 2,
    title: "Two emails",
    blurb: "An opener and a closer. Shortest useful sequence.",
  },
  {
    touches: 3,
    title: "Three emails",
    blurb: "An opener, something new in the middle, then a closer.",
  },
] as const

export function StepSequence({
  run,
  onChange,
}: {
  run: OutreachRun
  onChange: (patch: Partial<OutreachRun>) => void
}) {
  const touches = run.sequence_touches ?? 2

  return (
    <StepFrame
      title="How many emails, and how far apart?"
      blurb="Every step after the first is sent as a reply in the same thread, so only the opener needs a subject line. Gaps are in working days."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {TOUCH_OPTIONS.map((option) => {
          const selected = touches === option.touches
          return (
            <button
              key={option.touches}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ sequence_touches: option.touches })}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/40",
              )}
            >
              <p className="font-medium">{option.title}</p>
              <p className="text-sm text-muted-foreground">{option.blurb}</p>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {touches === 3 && (
            <div className="space-y-2">
              <Label htmlFor="advancer-gap">
                Working days before the second email
              </Label>
              <Input
                id="advancer-gap"
                type="number"
                min={1}
                max={60}
                value={run.sequence_advancer_gap ?? 3}
                onChange={(e) =>
                  onChange({ sequence_advancer_gap: Number(e.target.value) })
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="closer-gap">
              Working days before the {touches === 3 ? "third" : "second"} email
            </Label>
            <Input
              id="closer-gap"
              type="number"
              min={1}
              max={60}
              value={run.sequence_closer_gap ?? 4}
              onChange={(e) =>
                onChange({ sequence_closer_gap: Number(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>
    </StepFrame>
  )
}
