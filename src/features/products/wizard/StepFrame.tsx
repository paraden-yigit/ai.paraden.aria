import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface StepFrameProps {
  title: string
  subline: string
  children: ReactNode
  /** Back handler; the button is hidden on the first step (omit it). */
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  /** Show a spinner on the next button (used on the final commit step). */
  busy?: boolean
}

/**
 * Shared chrome for a product-wizard step: a title, a subline, the step's body,
 * and a Back / Continue footer. Keeps every step visually consistent.
 */
export function StepFrame({
  title,
  subline,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  busy = false,
}: StepFrameProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{subline}</p>
      </div>

      <div>{children}</div>

      <div className="flex items-center justify-between gap-2 border-t pt-4">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={onNext} disabled={nextDisabled || busy}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
