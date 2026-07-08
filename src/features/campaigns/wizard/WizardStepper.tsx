import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface WizardStep {
  title: string
}

interface WizardStepperProps {
  steps: WizardStep[]
  /** 0-based index of the active step. */
  current: number
  /** 0-based indices of steps that were skipped (rendered muted, not done). */
  skipped?: number[]
}

/** Horizontal step indicator for the campaign wizard. */
export function WizardStepper({ steps, current, skipped = [] }: WizardStepperProps) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, index) => {
        const isSkipped = skipped.includes(index)
        const isDone = index < current && !isSkipped
        const isActive = index === current
        const isLast = index === steps.length - 1

        return (
          <li
            key={step.title}
            className={cn("flex items-center", !isLast && "flex-1")}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  !isActive &&
                    !isDone &&
                    "border-border bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                  isSkipped && "line-through",
                )}
              >
                {step.title}
              </span>
            </div>
            {!isLast && (
              <span
                className={cn(
                  "mx-4 hidden h-px flex-1 sm:block",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
