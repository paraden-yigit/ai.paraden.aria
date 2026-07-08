import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAsync } from "@/hooks/useAsync"
import { clientService } from "@/services/client.service"
import { campaignService } from "@/services/campaign.service"
import { WizardStepper, type WizardStep } from "@/features/campaigns/wizard/WizardStepper"
import { StepDetails } from "@/features/campaigns/wizard/StepDetails"
import { StepUpload } from "@/features/campaigns/wizard/StepUpload"
import { StepMapping } from "@/features/campaigns/wizard/StepMapping"
import { StepReview } from "@/features/campaigns/wizard/StepReview"
import { StepDiscovery } from "@/features/campaigns/wizard/StepDiscovery"
import {
  SequenceBuilder,
  type SequenceConfig,
} from "@/features/campaigns/wizard/SequenceBuilder"
import { SequencePreview } from "@/features/campaigns/wizard/SequencePreview"
import type { ParsedCsv } from "@/features/campaigns/wizard/csv"
import type { Campaign } from "@/types/campaign"
import { campaignEmailService } from "@/services/campaign-email.service"
import { ApiError } from "@/services/http"
import type { EmailSelection } from "@/types/campaign-email"

// Top-level steps shown in the stepper. "Upload contacts" is a single step whose
// upload → map → review flow is handled internally as sub-steps (not surfaced in
// the stepper).
const STEPS: WizardStep[] = [
  { title: "Details" },
  { title: "Upload contacts" },
  { title: "Find contacts" },
  { title: "Sequence" },
  { title: "Preview" },
]

type MainStep = 0 | 1 | 2 | 3 | 4
type SubStep = "upload" | "mapping" | "review"

/**
 * Full-page campaign creation wizard (no app chrome — only a close button back to
 * the campaigns list). Step 1 creates the campaign; step 2 ("Upload contacts")
 * walks through uploading, mapping and reviewing a CSV as internal sub-steps.
 */
export function NewCampaignPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resumeId = searchParams.get("resume")
  const resumeMode = searchParams.get("mode")
  const { data: client } = useAsync(clientService.get, [])
  const [mainStep, setMainStep] = useState<MainStep>(0)
  const [subStep, setSubStep] = useState<SubStep>("upload")
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [sequenceConfig, setSequenceConfig] = useState<SequenceConfig | null>(null)
  const [loadingCampaign, setLoadingCampaign] = useState(Boolean(resumeId))

  // Resume an existing campaign's setup (from the campaigns list). "restart" was
  // already reset server-side, so it begins at step 1 (upload contacts);
  // "continue" resumes at the step last reached.
  useEffect(() => {
    if (!resumeId) return
    let active = true
    const load = async () => {
      try {
        const c = await campaignService.get(Number(resumeId))
        if (!active) return
        setCampaign(c)
        setSubStep("upload")
        // Restore a previously saved sequence so the builder resumes with it.
        if (c.sequence_touches === 2 || c.sequence_touches === 3) {
          setSequenceConfig({
            touches: c.sequence_touches,
            gaps: {
              advancer: c.sequence_advancer_gap ?? 6,
              closer: c.sequence_closer_gap ?? 17,
            },
            closerStyle: c.sequence_closer_style === "soft" ? "soft" : "pure",
          })
        }
        const step =
          resumeMode === "restart" ? 1 : Math.min(4, Math.max(1, c.setup_step))
        setMainStep(step as MainStep)
      } catch {
        toast.error("Couldn't open that campaign.")
        navigate("/campaigns")
      } finally {
        if (active) setLoadingCampaign(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [resumeId, resumeMode, navigate])

  // Persist the current top-level step so the user can resume where they left off.
  useEffect(() => {
    if (!campaign || campaign.setup_completed || mainStep < 1) return
    campaignService.update(campaign.id, { setup_step: mainStep }).catch(() => {})
  }, [campaign, mainStep])

  function close() {
    navigate("/campaigns")
  }

  function finish() {
    navigate(campaign ? `/campaigns/${campaign.id}` : "/campaigns")
  }

  async function complete(selections: EmailSelection[]) {
    if (campaign) {
      // Save the chosen outreach emails first — this is the point of the step,
      // so surface a failure and stay on the preview rather than completing.
      try {
        await campaignEmailService.save(campaign.id, selections)
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't save the emails.",
        )
        return
      }
      // Mark the wizard done so the campaigns list stops offering to resume it.
      try {
        await campaignService.update(campaign.id, { setup_completed: true })
      } catch {
        /* best effort — still take the user to the campaign */
      }
    }
    toast.success("Campaign created.")
    finish()
  }

  function renderContent() {
    if (loadingCampaign) {
      return (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    // Step 1 — details. Also the fallback if we somehow reach a later step with
    // no created campaign yet.
    if (mainStep === 0 || !campaign) {
      return (
        <StepDetails
          campaign={campaign}
          onSaved={(saved) => {
            setCampaign(saved)
            setSubStep("upload")
            setMainStep(1)
          }}
        />
      )
    }

    // Step 3 — find contacts (discovery).
    if (mainStep === 2) {
      return (
        <StepDiscovery
          campaignId={campaign.id}
          productId={campaign.product_id}
          onFinish={() => setMainStep(3)}
          onBack={() => {
            setSubStep(parsed ? "review" : "upload")
            setMainStep(1)
          }}
        />
      )
    }

    // Step 4 — sequence setup.
    if (mainStep === 3) {
      return (
        <SequenceBuilder
          clientName={client?.name ?? "Your"}
          initialTouches={sequenceConfig?.touches}
          initialGaps={sequenceConfig?.gaps}
          onBack={() => setMainStep(2)}
          onPreview={async (config) => {
            setSequenceConfig(config)
            if (campaign) {
              // Persist the approved sequence before previewing it.
              try {
                await campaignService.update(campaign.id, {
                  sequence_touches: config.touches,
                  sequence_advancer_gap: config.gaps.advancer,
                  sequence_closer_gap: config.gaps.closer,
                  sequence_closer_style: config.closerStyle,
                })
              } catch {
                toast.error("Couldn't save the sequence.")
              }
            }
            setMainStep(4)
          }}
        />
      )
    }

    // Step 5 — preview the sequence against a sample prospect.
    if (mainStep === 4) {
      return (
        <SequencePreview
          campaignId={campaign.id}
          shape={sequenceConfig?.touches ?? 3}
          advancerGap={sequenceConfig?.gaps.advancer ?? 6}
          closerGap={sequenceConfig?.gaps.closer ?? 17}
          onBack={() => setMainStep(3)}
          onCreate={complete}
        />
      )
    }

    // Step 2 — upload contacts (upload → mapping → review sub-steps).
    switch (subStep) {
      case "upload":
        return (
          <StepUpload
            campaignId={campaign.id}
            parsed={parsed}
            fileName={fileName}
            onParsed={(result, name) => {
              setParsed(result)
              setFileName(name)
            }}
            onClear={() => {
              setParsed(null)
              setFileName(null)
            }}
            onContinue={() => setSubStep("mapping")}
            onSkip={() => {
              setParsed(null)
              setFileName(null)
              setMainStep(2)
            }}
            onBack={() => setMainStep(0)}
          />
        )
      case "mapping":
        return parsed ? (
          <StepMapping
            campaignId={campaign.id}
            parsed={parsed}
            onSaved={() => setSubStep("review")}
            onBack={() => setSubStep("upload")}
          />
        ) : null
      case "review":
        return (
          <StepReview
            campaignId={campaign.id}
            onContinue={() => setMainStep(2)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">New campaign</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={close}
            aria-label="Close and return to campaigns"
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <WizardStepper steps={STEPS} current={mainStep} />
        </div>
        <div className="rounded-xl border bg-card p-6">{renderContent()}</div>
      </main>
    </div>
  )
}
