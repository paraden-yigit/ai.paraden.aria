import { useEffect, useState } from "react"
import { ArrowLeft, Check, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CompaniesAccordion } from "@/features/campaigns/wizard/CompaniesAccordion"
import { EditIcpDialog } from "@/features/products/EditIcpDialog"
import { campaignDiscoveryService } from "@/services/campaign-discovery.service"
import { campaignUploadService } from "@/services/campaign-upload.service"
import { ApiError } from "@/services/http"
import type { DiscoverySearch } from "@/types/campaign-discovery"
import type { CampaignUploadReview } from "@/types/campaign-upload"

interface StepDiscoveryProps {
  campaignId: number
  /** The campaign's product (for quick-editing the ICP); null if none. */
  productId: number | null
  onFinish: () => void
  onBack: () => void
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
 * fill the campaign to 50, runs the search in the background (polling for the
 * staged preview), and lets the user repopulate, approve (save), or skip.
 */
export function StepDiscovery({
  campaignId,
  productId,
  onFinish,
  onBack,
}: StepDiscoveryProps) {
  const [state, setState] = useState<DiscoverySearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [icpOpen, setIcpOpen] = useState(false)
  // Contacts already discovered + approved for this campaign (shown on resume).
  const [saved, setSaved] = useState<CampaignUploadReview | null>(null)

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
    onFinish()
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
            {productId != null && (
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
            )}
          </div>
        ) : state.target === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Campaign is full</p>
            <p className="text-xs text-muted-foreground">
              This campaign already has 50 companies.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No companies matched your ICP</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Your ideal customer profile may be too narrow. Try broadening it —
              widen the headcount range, add more industries or countries, or relax
              seniority — then repopulate.
            </p>
            {productId != null && (
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
            )}
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

        {productId != null && (
          <EditIcpDialog
            productId={productId}
            open={icpOpen}
            onOpenChange={setIcpOpen}
            onSaved={handleGenerate}
          />
        )}
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
            <Button type="button" onClick={onFinish}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Idle or failed — the prompt.
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
        <Sparkles className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Find new contacts?</p>
        <p className="max-w-md text-xs text-muted-foreground">
          We&apos;ll find companies matching your product&apos;s ICP — and a couple
          of contacts at each — to fill your campaign up to 50 companies. You can
          review and approve before anything is saved.
        </p>
        {status === "failed" && state?.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleSkip} disabled={busy}>
            Skip
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={busy}>
            <Sparkles className="size-4" />
            {status === "failed" ? "Try again" : "Find contacts"}
          </Button>
        </div>
      </div>
    </div>
  )
}
