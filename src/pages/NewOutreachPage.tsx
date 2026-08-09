import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { WizardStepper, type WizardStep } from "@/components/WizardStepper"
import { StepFrame } from "@/features/outreach/wizard/StepFrame"
import { StepApproach } from "@/features/outreach/wizard/StepApproach"
import { StepCta } from "@/features/outreach/wizard/StepCta"
import { StepCompanies } from "@/features/outreach/wizard/StepCompanies"
import { StepContacts } from "@/features/outreach/wizard/StepContacts"
import { StepDomains } from "@/features/outreach/wizard/StepDomains"
import { ReachSlider } from "@/features/outreach/wizard/ReachSlider"
import {
  HEADCOUNT_MAX,
  HEADCOUNT_MIN,
} from "@/features/outreach/wizard/headcountScale"
import { toRunIcp } from "@/features/outreach/wizard/useContactPoolSize"
import { StepSequence } from "@/features/outreach/wizard/StepSequence"
import {
  DEFAULT_ADVANCER_GAP,
  DEFAULT_CLOSER_GAP,
} from "@/features/outreach/wizard/sequenceGaps"
import { StepType } from "@/features/outreach/wizard/StepType"
import type { CampaignType } from "@/features/outreach/campaignTypes"
import { useAsync } from "@/hooks/useAsync"
import { useProductOptions } from "@/hooks/useProductOptions"
import { outreachService } from "@/services/outreach.service"
import { reachService } from "@/services/reach.service"
import type {
  CampaignSetup,
  DraftStep,
  OutreachIcpDraft,
  RunPoolSample,
} from "@/types/outreach"

/** Every step the wizard can show. Steps are addressed by key rather than by
 * index because the two campaign types do not have the same number of them. */
type StepKey =
  | "details"
  | "type"
  | "domains"
  | "companies"
  | "contacts"
  | "sequence"
  | "cta"
  | "approach"

/** Both types answer the same two questions — which companies, then who at them
 * — and only the first is asked differently: a Flow run describes the companies
 * it wants, a Strategic run uploads the ones it already knows. */
function steps(campaignType: CampaignType | null): (WizardStep & {
  key: StepKey
})[] {
  const audience: (WizardStep & { key: StepKey })[] = [
    {
      key: campaignType === "flow" ? "companies" : "domains",
      title: "Companies",
    },
    { key: "contacts", title: "Prospects" },
  ]
  return [
    { key: "details", title: "Details" },
    { key: "type", title: "Type" },
    ...audience,
    { key: "sequence", title: "Sequence" },
    { key: "cta", title: "Call to action" },
    { key: "approach", title: "Approach" },
  ]
}

/** Steps whose content is a table or several drafts side by side, and so get the
 * full width rather than the reading-width column the rest sit in. */
const WIDE_STEPS = new Set<StepKey>(["approach"])

const NUMBER = new Intl.NumberFormat("en-GB")

/** Nothing is chosen until the second step answers it, and nothing at all is
 * written until the last one. */
const EMPTY_SETUP: CampaignSetup = {
  campaign_type: null,
  sequence_touches: null,
  sequence_advancer_gap: null,
  sequence_closer_gap: null,
  cta_type: null,
}

/** A run's profile starts empty: what a campaign is aiming at is a decision to
 * make here, not one to inherit from the product and leave unread. */
const EMPTY_ICP: OutreachIcpDraft = {
  company_domains: [],
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

  // Everything lives here until "Create campaign" is pressed. The wizard keeps
  // no drafts, so there is nothing on the server to hold any of it.
  const [setup, setSetup] = useState<CampaignSetup>(EMPTY_SETUP)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  // Set once the campaign exists, so the guard below stops warning about work
  // that is no longer at risk.
  const [leaving, setLeaving] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  // Details, before the run exists.
  const [name, setName] = useState("")
  const [productId, setProductId] = useState<string>("")
  const [reach, setReach] = useState<number | null>(null)
  const products = useProductOptions()

  // What the allocation is measured against: this seat's monthly reach, from
  // the client's current plan and its add-ons.
  // Excluding this run, so editing a campaign does not count its own claim
  // against itself.
  const fetchAllowance = useCallback(() => reachService.allowance(), [])
  const { data: allowance } = useAsync(fetchAllowance, [fetchAllowance])

  // The profile a Flow run builds its pool from. Local, because the API has
  // nowhere to keep it yet — unlike the campaign type, which lives on the run.
  const [icp, setIcp] = useState<OutreachIcpDraft>(EMPTY_ICP)

  // The last pool answer the Contacts step got, saved beside the profile it
  // answers. `setState` is a stable reference, which is what the hook needs.
  const [pool, setPool] = useState<RunPoolSample | null>(null)

  // The approach chosen per step, kept locally so the choice shows immediately
  // and is written on the way out of the step.
  const [chosen, setChosen] = useState<Record<number, string>>({})
  // Which preview the chosen angles came from. The campaign is created with
  // this rather than with the copy itself — the browser picks the angle, the
  // server keeps the words.
  const [previewToken, setPreviewToken] = useState<string | null>(null)

  // Anything typed is only in this tab. A refresh, a closed tab or a Back
  // gesture takes all of it, so the browser is asked to check first — the one
  // warning it will show without being called from a click.
  const started = Boolean(name.trim() || productId)
  useEffect(() => {
    if (!started || leaving) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [started, leaving])

  const patch = useCallback((changes: Partial<CampaignSetup>) => {
    setSetup((current) => ({ ...current, ...changes }))
  }, [])

  // A Flow run finds its own people over two profile steps; a Strategic run is
  // handed a spreadsheet in one. Everything below asks the current step what it
  // *is* rather than where it sits, because the two flows are different lengths.
  const campaignType = setup.campaign_type
  const wizardSteps = steps(campaignType)
  const stepKey = wizardSteps[step]?.key ?? "details"
  const isLastStep = step === wizardSteps.length - 1

  // Null means "not allocated", which the API stores as null — a different
  // thing from allocating none.
  const reachValue = reach
  // What this campaign can still take. An unlimited plan has no ceiling to draw
  // a slider against, so it gets a generous one; a workspace with no plan gets
  // a nominal one rather than a slider with nowhere to go.
  const reachCeiling = allowance
    ? allowance.unlimited
      ? Math.max(100_000, (reachValue ?? 0) * 2)
      : Math.max(allowance.available, reachValue ?? 0, 1)
    : 1
  // What would be left after this campaign takes its share. `available` already
  // excludes this run's stored claim, so the subtraction is of the figure on
  // screen rather than of anything already counted.
  const remainingReach = Math.max(
    0,
    (allowance?.available ?? 0) - (reachValue ?? 0),
  )

  /** Write the whole campaign, once, at the end.
   *
   * Everything the wizard collected goes in one request and comes back
   * finished — there is no half-saved state to reconcile, because there was
   * never any half-saved state.
   */
  async function create() {
    setSaving(true)
    try {
      const created = await outreachService.create({
        name: name.trim(),
        product_id: Number(productId),
        monthly_reach: reachValue,
        campaign_type: setup.campaign_type,
        icp: toRunIcp(icp),
        pool_sample: pool,
        company_domains: icp.company_domains,
        sequence_touches: setup.sequence_touches,
        // The timeline states "wait 4 working days" from the moment it renders,
        // so those are the gaps the campaign is created with, touched or not.
        sequence_advancer_gap:
          setup.sequence_advancer_gap ?? DEFAULT_ADVANCER_GAP,
        sequence_closer_gap: setup.sequence_closer_gap ?? DEFAULT_CLOSER_GAP,
        cta_type: setup.cta_type,
        // The angle per step; the copy is read back from the preview it was
        // picked from rather than posted up from here.
        preview_token: previewToken,
        selections: Object.entries(chosen).map(([stepIndex, approach]) => ({
          step_index: Number(stepIndex),
          approach,
        })),
      })
      toast.success("Campaign created.")
      // Past the guard: there is nothing left to lose.
      setLeaving(true)
      navigate("/campaigns")
      return created
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.")
      return null
    } finally {
      setSaving(false)
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, wizardSteps.length - 1))
  }

  function handleChoose(draftStep: DraftStep, approachName: string) {
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
    // A Strategic run's companies are the uploaded list, so there is nothing to
    // continue with until something has been read out of a file or a paste.
    if (stepKey === "domains") return icp.company_domains.length > 0
    if (stepKey === "contacts") {
      return Boolean(
        icp.company_domains.length ||
          icp.industries.length ||
          icp.company_locations.length ||
          icp.departments.length ||
          icp.job_titles.length ||
          icp.seniority.length ||
          icp.locations.length,
      )
    }
    if (stepKey === "sequence") return Boolean(setup.sequence_touches)
    if (stepKey === "cta") return Boolean(setup.cta_type?.type)
    if (stepKey === "approach") {
      const needed = setup.sequence_touches ?? 0
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
            {name && (
              <span className="truncate text-sm text-muted-foreground">
                {name}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close and return to campaigns"
            onClick={() => (started ? setConfirmClose(true) : navigate("/campaigns"))}
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
                  <p className="text-xs text-muted-foreground">
                    Its value proposition, differentiator and pain points are
                    most of what the emails are written from.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Label htmlFor="run-reach">Reach</Label>
                    {/* The two figures the allocation is judged against: what
                      * the seat gets in a month, and what is left once this
                      * campaign has taken its share. Available counts down as
                      * the slider moves, so the cost of the choice is visible
                      * while it is being made. Both numbers are fixed-width and
                      * right-aligned: they change on every notch, and a label
                      * that jumps sideways is harder to read than one that
                      * does not. */}
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Total{" "}
                      <span className="inline-block min-w-14 text-right font-medium text-foreground">
                        {allowance == null
                          ? "—"
                          : allowance.unlimited
                            ? "unlimited"
                            : NUMBER.format(allowance.monthly_reach)}
                      </span>{" "}
                      · Available{" "}
                      <span className="inline-block min-w-14 text-right font-medium text-foreground">
                        {allowance == null
                          ? "—"
                          : allowance.unlimited
                            ? "unlimited"
                            : NUMBER.format(remainingReach)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-20 text-2xl font-semibold tabular-nums">
                      {NUMBER.format(reachValue ?? 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      contacts a month
                    </span>
                  </div>
                  <ReachSlider
                    id="run-reach"
                    value={reachValue}
                    onChange={setReach}
                    max={reachCeiling}
                  />
                  <p className="text-xs text-muted-foreground">
                    {allowance != null &&
                    !allowance.unlimited &&
                    allowance.monthly_reach === 0
                      ? "No plan is active on this workspace, so there is no reach to allocate yet."
                      : "How many contacts of your monthly reach this campaign may spend."}
                  </p>
                </div>
              </div>
            </StepFrame>
          )}

          {stepKey === "type" && (
            <StepType
              value={campaignType}
              onChange={(type) => patch({ campaign_type: type })}
            />
          )}
          {stepKey === "domains" && (
            <StepDomains value={icp} onChange={setIcp} />
          )}
          {stepKey === "companies" && (
            <StepCompanies value={icp} onChange={setIcp} />
          )}
          {stepKey === "contacts" && (
            <StepContacts value={icp} onChange={setIcp} onPool={setPool} />
          )}
          {stepKey === "sequence" && (
            <StepSequence run={setup} onChange={patch} />
          )}
          {stepKey === "cta" && <StepCta run={setup} onChange={patch} />}
          {stepKey === "approach" && (
            <StepApproach
              brief={{
                product_id: Number(productId),
                sequence_touches: setup.sequence_touches ?? 2,
                sequence_advancer_gap:
                  setup.sequence_advancer_gap ?? DEFAULT_ADVANCER_GAP,
                sequence_closer_gap:
                  setup.sequence_closer_gap ?? DEFAULT_CLOSER_GAP,
                cta_type: setup.cta_type,
                icp: toRunIcp(icp),
                samples: pool?.samples ?? [],
              }}
              chosen={chosen}
              onChoose={handleChoose}
              onToken={setPreviewToken}
            />
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
            <Button
              onClick={() => (isLastStep ? void create() : next())}
              disabled={!canAdvance || saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isLastStep ? (
                <Rocket className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {saving
                ? "Saving…"
                : isLastStep
                  ? "Create campaign"
                  : "Continue"}
            </Button>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Leave without creating this campaign?"
        description="Nothing here has been saved — a campaign is only created on the last step. Leaving now loses everything you have filled in, and it would have to be started again."
        confirmLabel="Leave and lose it"
        destructive
        onConfirm={() => {
          setLeaving(true)
          navigate("/campaigns")
        }}
      />
    </div>
  )
}
