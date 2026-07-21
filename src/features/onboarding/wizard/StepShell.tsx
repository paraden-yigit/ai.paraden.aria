import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface StepShellProps {
  title: string
  description?: string
  children: ReactNode
  /** Called when the primary (approve/continue) button is clicked. */
  onNext: () => void
  /** Omit to hide the Back button (first step). */
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  submitting?: boolean
}

/**
 * Shared layout for an onboarding approve/amend step: a heading, the editable
 * field(s), and a Back / primary button row. Mirrors the campaign wizard's step
 * chrome (ghost Back with ArrowLeft, primary with ArrowRight).
 */
export function StepShell({
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = "Approve & continue",
  nextDisabled,
  submitting,
}: StepShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="space-y-4">{children}</div>

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} disabled={submitting}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext} disabled={nextDisabled || submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
