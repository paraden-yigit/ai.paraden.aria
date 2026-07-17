import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { campaignService } from "@/services/campaign.service"
import { WizardStepper, type WizardStep } from "@/features/campaigns/wizard/WizardStepper"
import { StepDetails } from "@/features/campaigns/wizard/StepDetails"
import { StepIcp } from "@/features/campaigns/wizard/StepIcp"
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
  { title: "Ideal customers" },
  { title: "Upload contacts" },
  { title: "Find contacts" },
  { title: "Sequence" },
  { title: "Preview" },
]

type MainStep = 0 | 1 | 2 | 3 | 4 | 5
type SubStep = "upload" | "mapping" | "review"

// The last top-level step index (Preview), used to clamp a resumed setup_step.
const LAST_STEP: MainStep = 5

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
  const [mainStep, setMainStep] = useState<MainStep>(0)
  const [subStep, setSubStep] = useState<SubStep>("upload")
  // Steps the user chose to skip, so the stepper renders them as skipped
  // rather than pretending they were completed.
  const [skippedSteps, setSkippedSteps] = useState<number[]>([])
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
          resumeMode === "restart"
            ? 1
            : Math.min(LAST_STEP, Math.max(1, c.setup_step))
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

  function markSkipped(step: MainStep, skipped: boolean) {
    setSkippedSteps((prev) =>
      skipped
        ? prev.includes(step)
          ? prev
          : [...prev, step]
        : prev.filter((s) => s !== step),
    )
  }

  function close() {
    navigate("/campaigns")
  }

  function finish() {
    // justCompleted lets the campaign dashboard greet the user with its
    // completion moment instead of a cold landing.
    if (campaign) {
      navigate(`/campaigns/${campaign.id}`, { state: { justCompleted: true } })
    } else {
      navigate("/campaigns")
    }
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

    // Step 2 — ideal customers: clone the product's ICP to the campaign, make
    // final edits, and approve. Discovery then targets this campaign copy.
    if (mainStep === 1) {
      return (
        <StepIcp
          campaignId={campaign.id}
          productId={campaign.product_id}
          onApprove={() => {
            setSubStep("upload")
            setMainStep(2)
          }}
          onBack={() => setMainStep(0)}
        />
      )
    }

    // Step 4 — find contacts (discovery).
    if (mainStep === 3) {
      return (
        <StepDiscovery
          campaign={campaign}
          onCampaignChange={setCampaign}
          onFinish={(skipped) => {
            markSkipped(3, Boolean(skipped))
            setMainStep(4)
          }}
          onBack={() => {
            setSubStep(parsed ? "review" : "upload")
            setMainStep(2)
          }}
        />
      )
    }

    // Step 5 — sequence setup.
    if (mainStep === 4) {
      return (
        <SequenceBuilder
          initialTouches={sequenceConfig?.touches}
          initialGaps={sequenceConfig?.gaps}
          onBack={() => setMainStep(3)}
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
            setMainStep(5)
          }}
        />
      )
    }

    // Step 6 — preview the sequence against a sample prospect.
    if (mainStep === 5) {
      return (
        <SequencePreview
          campaignId={campaign.id}
          shape={sequenceConfig?.touches ?? 3}
          advancerGap={sequenceConfig?.gaps.advancer ?? 6}
          closerGap={sequenceConfig?.gaps.closer ?? 17}
          onBack={() => setMainStep(4)}
          onCreate={complete}
        />
      )
    }

    // Step 3 — upload contacts (upload → mapping → review sub-steps).
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
            onContinue={() => {
              markSkipped(2, false)
              setSubStep("mapping")
            }}
            onSkip={() => {
              setParsed(null)
              setFileName(null)
              markSkipped(2, true)
              setMainStep(3)
            }}
            onBack={() => setMainStep(1)}
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
            onContinue={() => setMainStep(3)}
          />
        )
      default:
        return null
    }
  }

  // Focused form steps read best narrow; list-heavy steps use the width.
  const narrowStep = mainStep === 0 || (mainStep === 1 && subStep === "upload")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mx-auto mb-8 max-w-3xl">
          <WizardStepper steps={STEPS} current={mainStep} skipped={skippedSteps} />
        </div>
        <div
          className={cn(
            "rounded-xl border bg-card p-6",
            narrowStep && "mx-auto max-w-2xl",
          )}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
