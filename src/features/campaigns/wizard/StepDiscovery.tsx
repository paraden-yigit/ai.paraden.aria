import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Check,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CompaniesAccordion } from "@/features/campaigns/wizard/CompaniesAccordion"
import { EditIcpDialog } from "@/features/products/EditIcpDialog"
import { campaignService } from "@/services/campaign.service"
import { campaignDiscoveryService } from "@/services/campaign-discovery.service"
import { campaignUploadService } from "@/services/campaign-upload.service"
import { ApiError } from "@/services/http"
import type { Campaign } from "@/types/campaign"
import type { DiscoverySearch } from "@/types/campaign-discovery"
import type { CampaignUploadReview } from "@/types/campaign-upload"

// Defaults offered the first time the user reaches this step.
const DEFAULT_TARGET_COMPANIES = 50
const DEFAULT_LIST_SIZE = 4

interface StepDiscoveryProps {
  campaign: Campaign
  /** Lift target edits so the wizard's campaign state stays in sync. */
  onCampaignChange: (campaign: Campaign) => void
  /** `skipped` is true when the user skipped discovery rather than approving. */
  onFinish: (skipped?: boolean) => void
  onBack: () => void
}

/** A field label with an info icon that explains the field on hover. */
function LabelWithHint({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string
  label: string
  hint: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={hint}
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{hint}</TooltipContent>
      </Tooltip>
    </div>
  )
}

const POLL_MS = 2500

const IDLE: DiscoverySearch = {
  status: "idle",
  error: null,
  target: null,
  companies_found: null,
  contacts_found: null,
  companies: [],
}

/**
 * Step "Find contacts" — asks whether to discover new ICP-matched companies to
 * reach the campaign's target, runs the search in the background (polling for the
 * staged preview), and lets the user repopulate, approve (save), or skip.
 */
export function StepDiscovery({
  campaign,
  onCampaignChange,
  onFinish,
  onBack,
}: StepDiscoveryProps) {
  const campaignId = campaign.id
  const [state, setState] = useState<DiscoverySearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [savingTarget, setSavingTarget] = useState(false)
  const [approving, setApproving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [icpOpen, setIcpOpen] = useState(false)
  // Contacts already discovered + approved for this campaign (shown on resume).
  const [saved, setSaved] = useState<CampaignUploadReview | null>(null)
  // The two targeting questions asked on this step, prefilled from the campaign.
  const [targetCompanies, setTargetCompanies] = useState(
    String(campaign.target_companies ?? DEFAULT_TARGET_COMPANIES),
  )
  const [listSize, setListSize] = useState(
    String(campaign.list_size ?? DEFAULT_LIST_SIZE),
  )
  const targetNum = Number(targetCompanies)
  const listNum = Number(listSize)
  const targetValid = Number.isInteger(targetNum) && targetNum >= 1
  const listValid = Number.isInteger(listNum) && listNum >= 1

  // Initial state fetch (a run may already be staged from a previous visit).
  useEffect(() => {
    let active = true
    campaignDiscoveryService
      .get(campaignId)
      .then((s) => active && setState(s))
      .catch(() => active && setState(IDLE))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [campaignId])

  // Already-discovered contacts (approved in a prior visit).
  useEffect(() => {
    let active = true
    campaignUploadService
      .review(campaignId, "discovered")
      .then((r) => active && setSaved(r))
      .catch(() => {
        /* non-fatal — just don't show the saved section */
      })
    return () => {
      active = false
    }
  }, [campaignId])

  // Poll while a run is active.
  const running = state?.status === "running"
  useEffect(() => {
    if (!running) return
    const id = setInterval(async () => {
      try {
        setState(await campaignDiscoveryService.get(campaignId))
      } catch {
        /* transient — keep polling */
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [running, campaignId])

  async function handleGenerate() {
    setStarting(true)
    try {
      setState(await campaignDiscoveryService.generate(campaignId))
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't start discovery.",
      )
    } finally {
      setStarting(false)
    }
  }

  // Save the two targeting answers, then kick off the search. Used from the
  // initial prompt, where the user sets the company target + list size.
  async function handleStart() {
    if (!targetValid || !listValid) return
    setSavingTarget(true)
    try {
      const updated = await campaignService.update(campaignId, {
        target_companies: targetNum,
        list_size: listNum,
      })
      onCampaignChange(updated)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save your target.",
      )
      setSavingTarget(false)
      return
    }
    setSavingTarget(false)
    await handleGenerate()
  }

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await campaignDiscoveryService.approve(campaignId)
      toast.success(
        `Saved ${res.contacts_created} contacts across ${res.companies_created} companies.`,
      )
      onFinish()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save contacts.")
      setApproving(false)
    }
  }

  async function handleSkip() {
    setSkipping(true)
    try {
      await campaignDiscoveryService.skip(campaignId)
    } catch {
      /* best effort — discard staging */
    }
    onFinish(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = state?.status ?? "idle"
  const busy = approving || skipping

  // Running — show progress.
  if (status === "running" || starting) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Finding companies and contacts…</p>
          <p className="text-xs text-muted-foreground">
            This can take a moment. You can wait here.
          </p>
        </div>
      </div>
    )
  }

  // Ready — show the staged preview.
  if (status === "ready" && state) {
    const companies = state.companies
    return (
      <div className="space-y-6">
        {companies.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Found{" "}
              <span className="font-medium text-foreground">
                {companies.length} companies
              </span>
              {state.contacts_found != null && (
                <>
                  {" "}and{" "}
                  <span className="font-medium text-foreground">
                    {state.contacts_found} contacts
                  </span>
                </>
              )}
              . Approve to add them, or repopulate for a different set.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIcpOpen(true)}
              disabled={busy}
            >
              <Pencil className="size-4" />
              Edit ICP
            </Button>
          </div>
        ) : state.target === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Target reached</p>
            <p className="text-xs text-muted-foreground">
              This campaign has already reached its target.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No companies matched your ICP</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Your ideal customer profile may be too narrow. Try broadening it:
              widen the headcount range, add more industries or countries, or
              relax seniority. Then repopulate.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIcpOpen(true)}
              disabled={busy}
            >
              <Pencil className="size-4" />
              Edit ICP
            </Button>
          </div>
        )}

        {companies.length > 0 && <CompaniesAccordion companies={companies} />}

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSkip} disabled={busy}>
              Skip
            </Button>
            {state.target !== 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerate}
                disabled={busy}
              >
                <RefreshCw className="size-4" />
                Repopulate
              </Button>
            )}
            {companies.length > 0 && (
              <Button type="button" onClick={handleApprove} disabled={busy}>
                {approving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Approve &amp; save
              </Button>
            )}
          </div>
        </div>

        <EditIcpDialog
          campaignId={campaignId}
          open={icpOpen}
          onOpenChange={setIcpOpen}
          onSaved={handleGenerate}
        />
      </div>
    )
  }

  // Resumed with already-discovered contacts and no active run — show them,
  // with the option to find more.
  if (saved && saved.companies.length > 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Already added{" "}
          <span className="font-medium text-foreground">
            {saved.total_contacts} contacts
          </span>{" "}
          across{" "}
          <span className="font-medium text-foreground">
            {saved.companies.length} companies
          </span>
          . Find more, or continue.
        </p>
        <CompaniesAccordion companies={saved.companies} />
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleGenerate}>
              <RefreshCw className="size-4" />
              Find more
            </Button>
            <Button type="button" onClick={() => onFinish()}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Idle or failed — the prompt with the two targeting questions.
  const startBusy = busy || savingTarget || starting
  return (
    <div className="space-y-6">
      <div className="space-y-5 rounded-lg border p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">Find new contacts</p>
        </div>
        <p className="text-xs text-muted-foreground">
          We&apos;ll find companies matching your campaign&apos;s ICP and a few
          contacts at each. You can review and approve before anything is saved.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <LabelWithHint
              htmlFor="target-companies"
              label="What's your target?"
              hint="How many companies you want to find for this campaign."
            />
            <Input
              id="target-companies"
              type="number"
              min={1}
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              disabled={startBusy}
              aria-invalid={!targetValid}
            />
          </div>
          <div className="space-y-2">
            <LabelWithHint
              htmlFor="list-size"
              label="What's your list size?"
              hint="How many contacts to find at each company. If a company has fewer, we keep it as-is."
            />
            <Input
              id="list-size"
              type="number"
              min={1}
              value={listSize}
              onChange={(e) => setListSize(e.target.value)}
              disabled={startBusy}
              aria-invalid={!listValid}
            />
          </div>
        </div>

        {status === "failed" && state?.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={startBusy}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={startBusy}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleStart}
            disabled={startBusy || !targetValid || !listValid}
          >
            {savingTarget || starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {status === "failed" ? "Try again" : "Find contacts"}
          </Button>
        </div>
      </div>
    </div>
  )
}
