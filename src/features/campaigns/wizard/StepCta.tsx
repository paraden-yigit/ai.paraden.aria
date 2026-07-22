import { useState } from "react"
import { ArrowLeft, ArrowRight, Loader2, MessageSquare, Quote } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAsync } from "@/hooks/useAsync"
import { campaignService } from "@/services/campaign.service"
import { ctaTypeService } from "@/services/ctaType.service"
import { ApiError } from "@/services/http"
import type { CtaType } from "@/types/campaign"

/** Prettify a CTA type key ("interest_check" → "Interest check") for display. */
function ctaLabel(type: string): string {
  const spaced = type.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

interface StepCtaProps {
  campaignId: number
  /** The campaign's saved CTA, if the user has been here before. */
  initialCta: CtaType | null
  /** Persist the chosen CTA and advance to the preview step. */
  onApprove: (cta: CtaType) => void
  onBack: () => void
}

/**
 * Step "Call to action" — pick how the sequence closes. Selecting a CTA reveals
 * its intent and an example closing line so the difference is visible before
 * committing. On approve, the whole option is saved onto the campaign (as JSON)
 * and the wizard advances to the email preview, which generates against it.
 */
export function StepCta({ campaignId, initialCta, onApprove, onBack }: StepCtaProps) {
  const [selectedType, setSelectedType] = useState<string>(initialCta?.type ?? "")
  const [submitting, setSubmitting] = useState(false)

  // The CTA options come from the admin-curated catalog (GET /api/cta-types).
  const { data: ctaOptions, loading, error, refetch } = useAsync(
    () => ctaTypeService.list(),
    [],
  )
  const options = ctaOptions ?? []

  const selected = options.find((o) => o.type === selectedType) ?? null

  async function handleContinue() {
    if (!selected) return
    setSubmitting(true)
    try {
      // Persist only the four fields a campaign stores, not the catalog metadata.
      const cta: CtaType = {
        type: selected.type,
        friction: selected.friction,
        intent: selected.intent,
        example_closing_line: selected.example_closing_line,
      }
      await campaignService.update(campaignId, { cta_type: cta })
      onApprove(cta)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save the call to action.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="cta-select">
          How should each email close?
        </label>
        <p className="text-sm text-muted-foreground">
          The call to action is the ask your closing line drives toward. Lower
          friction gets more replies; higher friction asks for more up front.
        </p>
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
          disabled={loading || !!error || options.length === 0}
        >
          <SelectTrigger id="cta-select" className="w-full">
            <SelectValue
              placeholder={
                loading ? "Loading call to actions…" : "Choose a call to action"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.type} value={option.type}>
                <span className="flex items-center gap-2">
                  {ctaLabel(option.type)}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      option.friction === "low" &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      option.friction === "medium" &&
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      option.friction === "high" &&
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {option.friction} friction
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-destructive">
            Couldn't load call to actions.{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={refetch}
            >
              Retry
            </button>
          </p>
        )}
        {!loading && !error && options.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No call to actions are available yet.
          </p>
        )}
      </div>

      {/* Once chosen, show what this CTA does and how it reads, so the difference
          between options is tangible. */}
      {selected && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex gap-3">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">What this does</p>
              <p className="text-sm text-muted-foreground">{selected.intent}</p>
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Example closing line</p>
              <p className="text-sm italic text-muted-foreground">
                “{selected.example_closing_line}”
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" onClick={handleContinue} disabled={!selected || submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Save & continue
        </Button>
      </div>
    </div>
  )
}
