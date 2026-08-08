import { Clock, CornerUpRight, Flag, Mail, Minus, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { OutreachRun } from "@/types/outreach"
import {
  DEFAULT_ADVANCER_GAP,
  DEFAULT_CLOSER_GAP,
  MAX_GAP,
  MIN_GAP,
} from "./sequenceGaps"
import { StepFrame } from "./StepFrame"

/**
 * The sequence step: how many emails, and how far apart.
 *
 * Every step after the first is sent as a *reply* in the opener's thread rather
 * than as a fresh email, which is why only the opener gets a subject line and
 * why the gaps are the only other thing to decide. Gaps are in working days: a
 * follow-up landing on a Sunday is a follow-up nobody reads.
 *
 * Drawn as the sequence itself rather than as a form. Two numeric inputs asked
 * the user to hold the shape of the campaign in their head; a timeline shows it
 * — what each email is for, and how long the silence between them lasts.
 */

const TOUCH_OPTIONS = [2, 3] as const

interface Touch {
  icon: LucideIcon
  title: string
  blurb: string
  /** The wait before the *next* email, or null on the last one. */
  gap: { value: number; field: keyof OutreachRun; before: string } | null
}

export function StepSequence({
  run,
  onChange,
}: {
  run: OutreachRun
  onChange: (patch: Partial<OutreachRun>) => void
}) {
  const touches = run.sequence_touches ?? 2
  const advancerGap = run.sequence_advancer_gap ?? DEFAULT_ADVANCER_GAP
  const closerGap = run.sequence_closer_gap ?? DEFAULT_CLOSER_GAP

  const opener: Touch = {
    icon: Mail,
    title: "The opener",
    blurb: "Introduces you and why you are relevant.",
    gap:
      touches === 3
        ? { value: advancerGap, field: "sequence_advancer_gap", before: "the follow up" }
        : { value: closerGap, field: "sequence_closer_gap", before: "the closer" },
  }
  const followUp: Touch = {
    icon: CornerUpRight,
    title: "The follow up",
    blurb: "Returns with a fresh angle and a soft ask.",
    gap: { value: closerGap, field: "sequence_closer_gap", before: "the closer" },
  }
  const closer: Touch = {
    icon: Flag,
    title: "The closer",
    blurb: "Politely closes the loop and leaves the door open.",
    gap: null,
  }
  const sequence = touches === 3 ? [opener, followUp, closer] : [opener, closer]

  return (
    <StepFrame
      title="How many emails, and how far apart?"
      blurb="Every step after the first is sent as a reply in the same thread, so only the opener needs a subject line. Gaps are in working days."
    >
      {/* A segmented control rather than two cards: the choice is one number,
        * and the timeline underneath already explains what each option means. */}
      <Tabs
        value={String(touches)}
        onValueChange={(next) => onChange({ sequence_touches: Number(next) })}
      >
        <TabsList aria-label="How many emails in the sequence">
          {TOUCH_OPTIONS.map((option) => (
            <TabsTrigger key={option} value={String(option)}>
              {option} emails
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ol>
        {sequence.map((touch, index) => {
          const last = index === sequence.length - 1
          return (
            <li key={touch.title} className="flex gap-4">
              {/* The rail: a marker per email, joined by the wait between them. */}
              <div className="flex flex-col items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <touch.icon className="size-4" aria-hidden />
                </div>
                {!last && (
                  <div className="w-px flex-1 border-l border-dashed" />
                )}
              </div>

              <div className={cn("flex-1", !last && "pb-6")}>
                <p className="font-semibold">
                  {index + 1}. {touch.title}
                </p>
                <p className="text-muted-foreground">{touch.blurb}</p>
                {touch.gap && (
                  <WaitRow
                    value={touch.gap.value}
                    before={touch.gap.before}
                    onChange={(next) => onChange({ [touch.gap!.field]: next })}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </StepFrame>
  )
}

/** "wait − 3 + working days": the silence before the next email. */
function WaitRow({
  value,
  before,
  onChange,
}: {
  value: number
  before: string
  onChange: (next: number) => void
}) {
  const step = (delta: number) =>
    onChange(Math.min(MAX_GAP, Math.max(MIN_GAP, value + delta)))

  return (
    <div
      role="group"
      aria-label={`Working days before ${before}`}
      className="mt-4 flex items-center gap-2 text-sm"
    >
      <Clock className="size-4 text-muted-foreground" aria-hidden />
      <span>wait</span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`One working day fewer before ${before}`}
        disabled={value <= MIN_GAP}
        onClick={() => step(-1)}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="min-w-5 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`One working day more before ${before}`}
        disabled={value >= MAX_GAP}
        onClick={() => step(1)}
      >
        <Plus className="size-3.5" />
      </Button>
      <span className="text-muted-foreground">working days</span>
    </div>
  )
}
