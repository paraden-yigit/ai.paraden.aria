import { useEffect, useState } from "react"
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { campaignEmailService } from "@/services/campaign-email.service"
import { ApiError } from "@/services/http"
import type {
  EmailGeneration,
  EmailProspect,
  EmailSelection,
  GeneratedEmailStep,
} from "@/types/campaign-email"

const POLL_MS = 2500

function prospectName(p: EmailProspect): string {
  return (
    p.full_name?.trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    p.email?.trim() ||
    "Selected prospect"
  )
}

function prospectInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const letters = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  return letters.toUpperCase() || "?"
}

function wordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length
}

/** Human label + timing note for a sequence step. */
function stepMeta(
  step: GeneratedEmailStep,
  advancerGap: number,
  closerGap: number,
  body: string,
): { name: string; timing: string } {
  const words = `${wordCount(body)} words`
  switch (step.step_kind) {
    case "opener":
      return { name: "Opener", timing: `day 0 · ${words}` }
    case "advancer":
      return {
        name: "Advancer",
        timing: `+${advancerGap} working days · new angle · ${words}`,
      }
    case "closer":
      return {
        name: "Closer",
        timing: `+${closerGap} working days · withdrawal · ${words}`,
      }
    default:
      return { name: `Step ${step.step_index}`, timing: words }
  }
}

interface SequencePreviewProps {
  campaignId: number
  /** Sequence shape — 2 drops the advancer card (informational; the backend
   * derives the actual steps from the saved sequence). */
  shape?: 2 | 3
  advancerGap?: number
  closerGap?: number
  onBack?: () => void
  /** Persist the chosen approach for each step, then finish the wizard. */
  onCreate?: (selections: EmailSelection[]) => void | Promise<void>
}

/**
 * Sequence Preview — the wizard's final step. On entry it spins up the outreach
 * email agent (Claude), polls until the whole sequence is drafted, then shows 3
 * approaches per step. The user picks one approach per step; "Create campaign"
 * saves the chosen subject/body pairs.
 */
export function SequencePreview({
  campaignId,
  shape = 3,
  advancerGap = 6,
  closerGap = 17,
  onBack,
  onCreate,
}: SequencePreviewProps) {
  const [gen, setGen] = useState<EmailGeneration | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  // step_index → chosen approach index (defaults to 0 when unset).
  const [selected, setSelected] = useState<Record<number, number>>({})

  // On entry, load state and kick off generation if none has run yet.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        let state = await campaignEmailService.get(campaignId)
        // Generate when nothing has run yet, or when a stale run doesn't match
        // the current sequence length (e.g. the user changed touches and came
        // back). A "generating"/"ready" run of the right size is reused.
        const stale =
          state.status === "ready" && state.steps.length !== shape
        if (state.status === "idle" || state.status === "failed" || stale) {
          state = await campaignEmailService.generate(campaignId)
        }
        if (active) setGen(state)
      } catch (err) {
        if (active) {
          setGen({
            status: "failed",
            error:
              err instanceof ApiError
                ? err.message
                : "Couldn't generate emails.",
            prospect: null,
            steps: [],
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [campaignId, shape])

  // Poll while the agent is drafting.
  const generating = gen?.status === "generating"
  useEffect(() => {
    if (!generating) return
    const id = setInterval(async () => {
      try {
        setGen(await campaignEmailService.get(campaignId))
      } catch {
        /* transient — keep polling */
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [generating, campaignId])

  async function handleRegenerate() {
    try {
      setGen(await campaignEmailService.generate(campaignId))
    } catch (err) {
      setGen({
        status: "failed",
        error:
          err instanceof ApiError ? err.message : "Couldn't generate emails.",
        prospect: null,
        steps: [],
      })
    }
  }

  async function handleCreate() {
    if (!gen || gen.status !== "ready" || !onCreate) return
    const selections: EmailSelection[] = gen.steps.map((step) => ({
      step_index: step.step_index,
      approach_index: selected[step.step_index] ?? 0,
    }))
    setCreating(true)
    try {
      await onCreate(selections)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = gen?.status ?? "failed"

  // Drafting — show progress.
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Writing your outreach sequence…</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Our agent is drafting a few approaches for each step from your brand
          profile, product, and outreach instructions. This can take a moment.
        </p>
      </div>
    )
  }

  // Failed — offer a retry.
  if (status === "failed" || !gen) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Sparkles className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Couldn&apos;t draft the emails</p>
          {gen?.error && (
            <p className="max-w-md text-xs text-destructive">{gen.error}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" onClick={handleRegenerate}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // Ready — the drafted sequence.
  const prospect = gen.prospect
  return (
    <div className="space-y-6">
      {/* Which contact the agent wrote these drafts to. */}
      {prospect ? (
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {prospectInitials(prospectName(prospect))}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {prospectName(prospect)}
              {prospect.company_name && (
                <> · {prospect.company_name}</>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {[
                prospect.job_title,
                prospect.company_industry,
                prospect.company_domain,
              ]
                .filter(Boolean)
                .join(" · ") || "Written to your most complete contact"}
            </p>
          </div>
          <span className="ml-auto shrink-0 self-start rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            sample prospect
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No contacts yet, so these are reusable templates: placeholders like{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{first_name}}"}
          </code>{" "}
          will be filled in for each prospect.
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Pick an approach for each step.
          {prospect
            ? " The drafts are written to the contact above."
            : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={creating}
        >
          <RefreshCw className="size-4" />
          Regenerate
        </Button>
      </div>

      <div className="space-y-4">
        {gen.steps.map((step, index) => (
          <TouchCard
            key={step.step_index}
            number={index + 1}
            step={step}
            advancerGap={advancerGap}
            closerGap={closerGap}
            selectedIndex={selected[step.step_index] ?? 0}
            onSelect={(approachIndex) =>
              setSelected((prev) => ({
                ...prev,
                [step.step_index]: approachIndex,
              }))
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={creating}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" onClick={handleCreate} disabled={creating}>
          {creating && <Loader2 className="size-4 animate-spin" />}
          Create campaign
        </Button>
      </div>
    </div>
  )
}

function TouchCard({
  number,
  step,
  advancerGap,
  closerGap,
  selectedIndex,
  onSelect,
}: {
  number: number
  step: GeneratedEmailStep
  advancerGap: number
  closerGap: number
  selectedIndex: number
  onSelect: (approachIndex: number) => void
}) {
  const approach =
    step.approaches[selectedIndex] ?? step.approaches[0] ?? null
  const { name, timing } = stepMeta(step, advancerGap, closerGap, approach?.body ?? "")

  return (
    <div className="space-y-3 rounded-lg border p-4">
      {/* Card header row */}
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
          {number}
        </span>
        <span className="font-medium">{name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{timing}</span>
      </div>

      {/* Approach pills */}
      <div className="flex flex-wrap gap-2">
        {step.approaches.map((option, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={selectedIndex === index}
            onClick={() => onSelect(index)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              selectedIndex === index
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.name}
          </button>
        ))}
      </div>

      {/* Email block — quoted by a left rule */}
      {approach && (
        <div className="border-l-2 border-border pl-4">
          <p className="pb-2 text-sm">
            <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground">
              subject
            </span>
            <span className="font-medium">{approach.subject}</span>
          </p>
          <div className="border-t" />
          <div className="whitespace-pre-line pt-3 text-sm text-muted-foreground">
            {approach.body}
          </div>
        </div>
      )}
    </div>
  )
}
