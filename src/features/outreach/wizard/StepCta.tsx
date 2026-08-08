import { useCallback } from "react"

import { DataState } from "@/components/DataState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAsync } from "@/hooks/useAsync"
import { cn } from "@/lib/utils"
import { ctaTypeService } from "@/services/ctaType.service"
import type { CtaFriction, CtaTypeOption } from "@/types/ctaType"
import type { CtaOption, OutreachRun } from "@/types/outreach"
import { StepFrame } from "./StepFrame"

/** Lowest ask first: the list reads as a ramp from "worth a look?" to "book a
 * demo", which is the decision being made. */
const FRICTION_ORDER: Record<CtaFriction, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

/** Friction is the trade-off, so it is coloured like one — not decoration. */
const FRICTION_STYLES: Record<CtaFriction, string> = {
  low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
}

function FrictionTag({ friction }: { friction: CtaFriction }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        FRICTION_STYLES[friction],
      )}
    >
      {friction} friction
    </span>
  )
}

/**
 * The call-to-action step: what every closing line drives toward.
 *
 * One choice, so one dropdown — nine cards made a single decision look like nine
 * of them. Friction rides on every option because it is the trade-off being
 * made, not a label: a low-friction ask ("worth a look?") gets more replies and
 * commits nobody, a high-friction one ("30 minutes on Thursday?") gets fewer and
 * commits properly. What the chosen ask actually does, and how it sounds, is
 * spelled out under the field once there is something to spell out.
 *
 * The whole option is stored on the run by value rather than referenced by id.
 * An admin editing the catalog later must not silently rewrite what a run
 * already asked for.
 */
export function StepCta({
  run,
  onChange,
}: {
  run: OutreachRun
  onChange: (patch: { cta_type: CtaOption }) => void
}) {
  const fetchTypes = useCallback(() => ctaTypeService.list(), [])
  const { data, loading, error, refetch } = useAsync(fetchTypes, [])
  const options = [...(data ?? [])].sort(
    (a: CtaTypeOption, b: CtaTypeOption) =>
      FRICTION_ORDER[a.friction] - FRICTION_ORDER[b.friction],
  )
  const selected = options.find((o) => o.type === run.cta_type?.type) ?? null

  return (
    <StepFrame
      title="How should each email close?"
      blurb="The call to action is the ask your closing line drives toward. Lower friction gets more replies; higher friction asks for more up front."
    >
      <DataState
        loading={loading}
        error={error}
        isEmpty={options.length === 0}
        emptyMessage="No calls to action are set up yet. Ask an admin to add some."
        onRetry={refetch}
      >
        <Select
          value={selected?.type ?? ""}
          onValueChange={(type) => {
            const option = options.find((o) => o.type === type)
            if (!option) return
            onChange({
              cta_type: {
                type: option.type,
                friction: option.friction,
                intent: option.intent,
                example_closing_line: option.example_closing_line,
              },
            })
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Choose a call to action" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.type}>
                <span className="flex items-center gap-2">
                  {option.type}
                  <FrictionTag friction={option.friction} />
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm">{selected.intent}</p>
            {selected.example_closing_line && (
              <p className="text-sm text-muted-foreground italic">
                “{selected.example_closing_line}”
              </p>
            )}
          </div>
        )}
      </DataState>
    </StepFrame>
  )
}
