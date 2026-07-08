import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { WizardStepper, type WizardStep } from "@/features/campaigns/wizard/WizardStepper"
import { StepDetails } from "@/features/campaigns/wizard/StepDetails"
import { StepUpload } from "@/features/campaigns/wizard/StepUpload"
import { StepMapping } from "@/features/campaigns/wizard/StepMapping"
import { StepReview } from "@/features/campaigns/wizard/StepReview"
import type { ParsedCsv } from "@/features/campaigns/wizard/csv"
import type { Campaign } from "@/types/campaign"

// Top-level steps shown in the stepper. "Upload contacts" is a single step whose
// upload → map → review flow is handled internally as sub-steps (not surfaced in
// the stepper).
const STEPS: WizardStep[] = [{ title: "Details" }, { title: "Upload contacts" }]

type MainStep = 0 | 1
type SubStep = "upload" | "mapping" | "review"

/**
 * Full-page campaign creation wizard (no app chrome — only a close button back to
 * the campaigns list). Step 1 creates the campaign; step 2 ("Upload contacts")
 * walks through uploading, mapping and reviewing a CSV as internal sub-steps.
 */
export function NewCampaignPage() {
  const navigate = useNavigate()
  const [mainStep, setMainStep] = useState<MainStep>(0)
  const [subStep, setSubStep] = useState<SubStep>("upload")
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [skippedUpload, setSkippedUpload] = useState(false)

  function close() {
    navigate("/campaigns")
  }

  function finish() {
    navigate(campaign ? `/campaigns/${campaign.id}` : "/campaigns")
  }

  function renderContent() {
    // Step 1 — details. Also the fallback if we somehow reach step 2 with no
    // created campaign yet.
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

    // Step 2 — upload contacts (upload → mapping → review sub-steps).
    switch (subStep) {
      case "upload":
        return (
          <StepUpload
            parsed={parsed}
            fileName={fileName}
            onParsed={(result, name) => {
              setParsed(result)
              setFileName(name)
              setSkippedUpload(false)
            }}
            onClear={() => {
              setParsed(null)
              setFileName(null)
            }}
            onContinue={() => setSubStep("mapping")}
            onSkip={() => {
              setParsed(null)
              setFileName(null)
              setSkippedUpload(true)
              setSubStep("review")
            }}
            onBack={() => setMainStep(0)}
          />
        )
      case "mapping":
        return parsed ? (
          <StepMapping
            campaignId={campaign.id}
            parsed={parsed}
            onSaved={() => {
              setSkippedUpload(false)
              setSubStep("review")
            }}
            onBack={() => setSubStep("upload")}
          />
        ) : null
      case "review":
        return (
          <StepReview
            campaignId={campaign.id}
            skippedUpload={skippedUpload}
            onFinish={finish}
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
