import { useCallback } from "react"

import { Badge } from "@/components/ui/badge"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { cn } from "@/lib/utils"
import { ctaTypeService } from "@/services/ctaType.service"
import type { CtaTypeOption } from "@/types/ctaType"
import type { CtaOption, OutreachRun } from "@/types/outreach"
import { StepFrame } from "./StepFrame"

/**
 * The call-to-action step: what every closing line drives toward.
 *
 * Friction is shown because it is the trade-off being made, not a label: a
 * low-friction ask ("worth a look?") gets more replies and commits nobody, a
 * high-friction one ("30 minutes on Thursday?") gets fewer and commits properly.
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
  const options = data ?? []
  const selected = run.cta_type?.type ?? null

  return (
    <StepFrame
      title="What are you asking for?"
      blurb="The ask every closing line drives toward. Lower friction gets more replies; higher friction gets fewer but better ones."
    >
      <DataState
        loading={loading}
        error={error}
        isEmpty={options.length === 0}
        emptyMessage="No calls to action are set up yet. Ask an admin to add some."
        onRetry={refetch}
      >
        <div className="grid gap-3">
          {options.map((option: CtaTypeOption) => {
            const isSelected = selected === option.type
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onChange({
                    cta_type: {
                      type: option.type,
                      friction: option.friction,
                      intent: option.intent,
                      example_closing_line: option.example_closing_line,
                    },
                  })
                }
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/40",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{option.type}</p>
                  <Badge variant="outline" className="capitalize">
                    {option.friction} friction
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {option.intent}
                </p>
                {option.example_closing_line && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    “{option.example_closing_line}”
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </DataState>
    </StepFrame>
  )
}
