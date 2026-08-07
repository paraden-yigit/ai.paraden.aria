import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Loader2, Rocket, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { WizardStepper, type WizardStep } from "@/components/WizardStepper"
import { StepFrame } from "@/features/outreach/wizard/StepFrame"
import { StepApproach } from "@/features/outreach/wizard/StepApproach"
import { StepCta } from "@/features/outreach/wizard/StepCta"
import { StepCompanies } from "@/features/outreach/wizard/StepCompanies"
import { StepContacts } from "@/features/outreach/wizard/StepContacts"
import {
  HEADCOUNT_MAX,
  HEADCOUNT_MIN,
} from "@/features/outreach/wizard/headcountScale"
import { StepList } from "@/features/outreach/wizard/StepList"
import { StepReview } from "@/features/outreach/wizard/StepReview"
import { StepSequence } from "@/features/outreach/wizard/StepSequence"
import { StepType } from "@/features/outreach/wizard/StepType"
import type { CampaignType } from "@/features/outreach/campaignTypes"
import { useProductOptions } from "@/hooks/useProductOptions"
import { outreachService } from "@/services/outreach.service"
import type {
  DraftStep,
  OutreachIcpDraft,
  OutreachRun,
} from "@/types/outreach"

/** Every step the wizard can show. Steps are addressed by key rather than by
 * index because the two campaign types do not have the same number of them. */
type StepKey =
  | "details"
  | "type"
  | "list"
  | "companies"
  | "contacts"
  | "sequence"
  | "cta"
  | "approach"
  | "review"

/** Where the audience comes from depends on the type: a Strategic run is handed
 * a list in one step, a Flow run is asked for a profile in two — the companies
 * to look inside, then the people at them. */
function steps(campaignType: CampaignType | null): (WizardStep & {
  key: StepKey
})[] {
  const audience: (WizardStep & { key: StepKey })[] =
    campaignType === "flow"
      ? [
          { key: "companies", title: "Companies" },
          { key: "contacts", title: "Contacts" },
        ]
      : [{ key: "list", title: "List" }]
  return [
    { key: "details", title: "Details" },
    { key: "type", title: "Type" },
    ...audience,
    { key: "sequence", title: "Sequence" },
    { key: "cta", title: "Call to action" },
    { key: "approach", title: "Approach" },
    { key: "review", title: "Review" },
  ]
}

/** Steps whose content is a table or several drafts side by side, and so get the
 * full width rather than the reading-width column the rest sit in. */
const WIDE_STEPS = new Set<StepKey>(["list", "approach", "review"])

/** A run's profile starts empty: what a campaign is aiming at is a decision to
 * make here, not one to inherit from the product and leave unread. */
const EMPTY_ICP: OutreachIcpDraft = {
  industries: [],
  company_locations: [],
  headcount_min: HEADCOUNT_MIN,
  headcount_max: HEADCOUNT_MAX,
  departments: [],
  job_titles: [],
  seniority: [],
  locations: [],
}

/**
 * The outreach wizard.
 *
 * Full-page and outside the app shell, like the product and onboarding wizards:
 * building a run is a task with an end, not a place in the app.
 *
 * The run row exists from the first step onward and every step saves as it is
 * left, so a half-built run survives a closed tab and reopens where it stopped
 * (`?resume=<id>`). Nothing here sends anything — the last step composes, and
 * launching is a separate, deliberate press.
 */
export function NewOutreachPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const resumeId = Number(params.get("resume")) || null

  const [run, setRun] = useState<OutreachRun | null>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Details, before the run exists.
  const [name, setName] = useState("")
  const [productId, setProductId] = useState<string>("")
  const products = useProductOptions()

  // The profile a Flow run builds its pool from. Local, because the API has
  // nowhere to keep it yet — unlike the campaign type, which lives on the run.
  const [icp, setIcp] = useState<OutreachIcpDraft>(EMPTY_ICP)

  // The approach chosen per step, kept locally so the choice shows immediately
  // and is written on the way out of the step.
  const [chosen, setChosen] = useState<Record<number, string>>({})
  const chosenBodies = useRef<Record<number, DraftStep["approaches"][number]>>(
    {},
  )

  useEffect(() => {
    if (!resumeId) return
    let active = true
    void (async () => {
      try {
        const existing = await outreachService.get(resumeId)
        if (!active) return
        setRun(existing)
        setName(existing.name)
        setProductId(existing.product_id ? String(existing.product_id) : "")
        setStep(
          Math.min(
            Math.max(existing.step - 1, 0),
            steps(existing.campaign_type).length - 1,
          ),
        )
        const selections = await outreachService.getSelections(resumeId)
        if (!active) return
        setChosen(
          Object.fromEntries(
            selections
              .filter((s) => s.approach)
              .map((s) => [s.step_index, s.approach as string]),
          ),
        )
      } catch {
        toast.error("That run could not be opened.")
        navigate("/campaigns")
      }
    })()
    return () => {
      active = false
    }
  }, [resumeId, navigate])

  const patch = useCallback((changes: Partial<OutreachRun>) => {
    setRun((current) => (current ? { ...current, ...changes } : current))
  }, [])

  // A Flow run finds its own people over two profile steps; a Strategic run is
  // handed a spreadsheet in one. Everything below asks the current step what it
  // *is* rather than where it sits, because the two flows are different lengths.
  const campaignType = run?.campaign_type ?? null
  const wizardSteps = steps(campaignType)
  const stepKey = wizardSteps[step]?.key ?? "details"

  /** Persist the current step, creating the run on the first one. */
  async function save(): Promise<OutreachRun | null> {
    setSaving(true)
    try {
      if (!run) {
        if (!name.trim() || !productId) {
          toast.error("Give the run a name and choose a product.")
          return null
        }
        const created = await outreachService.create({
          name: name.trim(),
          product_id: Number(productId),
        })
        setRun(created)
        return created
      }
      // The approach step writes selections rather than run fields.
      if (stepKey === "approach") {
        const selections = Object.entries(chosenBodies.current).map(
          ([stepIndex, approach]) => ({
            step_index: Number(stepIndex),
            approach: approach.name,
            subject: approach.subject || null,
            body: approach.body,
          }),
        )
        if (selections.length) {
          await outreachService.saveSelections(run.id, selections)
        }
      }
      const updated = await outreachService.update(run.id, {
        name: name.trim() || run.name,
        step: Math.min(step + 2, wizardSteps.length),
        sequence_touches: run.sequence_touches ?? undefined,
        sequence_advancer_gap: run.sequence_advancer_gap ?? undefined,
        sequence_closer_gap: run.sequence_closer_gap ?? undefined,
        campaign_type: run.campaign_type ?? undefined,
        cta_type: run.cta_type,
      })
      setRun(updated)
      return updated
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.")
      return null
    } finally {
      setSaving(false)
    }
  }

  async function next() {
    const saved = await save()
    if (!saved) return
    setStep((s) => Math.min(s + 1, wizardSteps.length - 1))
  }

  function handleChoose(
    draftStep: DraftStep,
    approachName: string,
  ) {
    const approach = draftStep.approaches.find((a) => a.name === approachName)
    if (!approach) return
    chosenBodies.current[draftStep.step_index] = approach
    setChosen((current) => ({
      ...current,
      [draftStep.step_index]: approachName,
    }))
  }

  const canAdvance = (() => {
    if (stepKey === "details") return Boolean(name.trim() && productId)
    if (stepKey === "type") return Boolean(campaignType)
    // An empty profile describes everybody, which is nobody worth writing to.
    // Checked on the way out of the contacts step rather than the companies one,
    // so either half can carry it — industries alone is a profile, and so is a
    // job title alone. Size does not count: it starts at the full range, so it
    // is not a choice anyone has made yet.
    if (stepKey === "contacts") {
      return Boolean(
        icp.industries.length ||
          icp.company_locations.length ||
          icp.departments.length ||
          icp.job_titles.length ||
          icp.seniority.length ||
          icp.locations.length,
      )
    }
    if (stepKey === "sequence") return Boolean(run?.sequence_touches)
    if (stepKey === "cta") return Boolean(run?.cta_type?.type)
    if (stepKey === "approach") {
      const needed = run?.sequence_touches ?? 0
      return Object.keys(chosen).length >= needed && needed > 0
    }
    return true
  })()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              New outreach
            </h1>
            {(run?.name || name) && (
              <span className="truncate text-sm text-muted-foreground">
                {run?.name || name}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close and return to campaigns"
            onClick={() => navigate("/campaigns")}
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mx-auto mb-8 max-w-3xl">
          <WizardStepper steps={wizardSteps} current={step} />
        </div>

        {/* The step and its Back/Continue footer share one card, as in the
          * product wizard. The footer stays here rather than moving into
          * StepFrame (where the product wizard keeps it) because every step
          * shares one `canAdvance`/`save` pair — threading those through six
          * step components would buy nothing the border already says. */}
        <div
          className={cn(
            "space-y-6 rounded-xl border bg-card p-6",
            !WIDE_STEPS.has(stepKey) && "mx-auto max-w-2xl",
          )}
        >
          {stepKey === "details" && (
            <StepFrame
              title="What are you selling, and what shall we call this?"
              blurb="The product's value proposition, differentiator, pain points and supporting documents are most of what the emails are written from."
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="run-name">Name</Label>
                  <Input
                    id="run-name"
                    value={name}
                    placeholder="Q3 finance leaders"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-product">Product</Label>
                  <Select
                    value={productId}
                    onValueChange={setProductId}
                    disabled={Boolean(run)}
                  >
                    <SelectTrigger id="run-product">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.options.map((product) => (
                        <SelectItem key={product.value} value={product.value}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {run && (
                    <p className="text-xs text-muted-foreground">
                      The product is fixed once a run starts — its targeting was
                      copied onto this run when it was created.
                    </p>
                  )}
                </div>
              </div>
            </StepFrame>
          )}

          {stepKey === "type" && run && (
            <StepType
              value={campaignType}
              onChange={(type) => patch({ campaign_type: type })}
            />
          )}
          {stepKey === "list" && run && <StepList runId={run.id} />}
          {stepKey === "companies" && (
            <StepCompanies value={icp} onChange={setIcp} />
          )}
          {stepKey === "contacts" && (
            <StepContacts value={icp} onChange={setIcp} />
          )}
          {stepKey === "sequence" && run && (
            <StepSequence run={run} onChange={patch} />
          )}
          {stepKey === "cta" && run && <StepCta run={run} onChange={patch} />}
          {stepKey === "approach" && run && (
            <StepApproach
              runId={run.id}
              chosen={chosen}
              onChoose={handleChoose}
            />
          )}
          {stepKey === "review" && run && (
            <StepReview run={run} onRunChange={setRun} />
          )}

          <div className="flex items-center justify-between gap-2 border-t pt-4">
            {step === 0 ? (
              <span />
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={saving}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            )}
            {step < wizardSteps.length - 1 ? (
              <Button
                onClick={() => void next()}
                disabled={!canAdvance || saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {saving ? "Saving…" : "Continue"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/campaigns")}>
                <Rocket className="size-4" />
                Done
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
