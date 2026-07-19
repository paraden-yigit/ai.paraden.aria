import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WizardStepper, type WizardStep } from "@/features/campaigns/wizard/WizardStepper"
import { OnboardingHeader } from "@/features/onboarding/wizard/OnboardingHeader"
import { StepShell } from "@/features/onboarding/wizard/StepShell"
import { IndustryCombobox } from "@/features/onboarding/wizard/IndustryCombobox"
import { LogoPicker } from "@/features/onboarding/wizard/LogoPicker"
import { INDUSTRIES } from "@/features/companies/industries"
import { useAuth } from "@/features/auth/useAuth"
import { clientService } from "@/services/client.service"
import { ApiError } from "@/services/http"
import type { OnboardingDraft } from "@/types/client"

const STEPS: WizardStep[] = [
  { title: "Website" },
  { title: "Company info" },
  { title: "What you do" },
  { title: "Branding" },
]

interface OnboardingForm {
  name: string
  city: string
  country: string
  url: string
  linkedin_url: string
  industry: string
  value_proposition: string
  tone_description: string
}

const EMPTY_FORM: OnboardingForm = {
  name: "",
  city: "",
  country: "",
  url: "",
  linkedin_url: "",
  industry: "",
  value_proposition: "",
  tone_description: "",
}

/** Convert a base64 data URL into a Blob for uploading, or null if invalid. */
async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl)
    return await response.blob()
  } catch {
    return null
  }
}

/**
 * First-login onboarding wizard (full screen, no app chrome). The owner enters
 * their website URL; the backend crawls + extracts a draft company profile, which
 * the owner approves/amends step by step. Completion saves the profile onto the
 * client and flips `onboarding_completed`.
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [step, setStep] = useState(0)
  const [urlInput, setUrlInput] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBlob, setLogoBlob] = useState<Blob | null>(null)

  // Only the owner runs the wizard; anyone who has already completed it (or lands
  // here by accident) goes to the dashboard. The route guard handles the rest.
  if (user && user.client_onboarding_completed) {
    return <Navigate to="/" replace />
  }
  if (user && user.role !== "owner") {
    return <Navigate to="/" replace />
  }

  const set = (key: keyof OnboardingForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function analyze() {
    const url = urlInput.trim()
    if (!url) {
      toast.error("Enter your company website URL.")
      return
    }
    setExtracting(true)
    try {
      const draft: OnboardingDraft = await clientService.extractOnboarding(url)
      setForm({
        name: draft.name ?? "",
        city: draft.city ?? "",
        country: draft.country ?? "",
        url: draft.url ?? url,
        linkedin_url: draft.linkedin_url ?? "",
        industry: draft.industry ?? "",
        value_proposition: draft.value_proposition ?? "",
        tone_description: draft.tone_description ?? "",
      })
      if (draft.logo_data_url) {
        setLogoPreview(draft.logo_data_url)
        setLogoBlob(await dataUrlToBlob(draft.logo_data_url))
      }
      setStep(1)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't analyze that website. Check the URL and try again.",
      )
    } finally {
      setExtracting(false)
    }
  }

  function pickLogo(file: File) {
    setLogoBlob(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function removeLogo() {
    setLogoBlob(null)
    setLogoPreview(null)
  }

  async function finish() {
    setSubmitting(true)
    try {
      await clientService.update({
        name: form.name.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        url: form.url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        industry: form.industry.trim() || null,
        value_proposition: form.value_proposition.trim() || null,
        tone_description: form.tone_description.trim() || null,
        onboarding_completed: true,
      })
      if (logoBlob) {
        try {
          await clientService.uploadLogo(logoBlob)
        } catch {
          // The profile is saved; a logo hiccup shouldn't block finishing.
          toast.error("Saved your company, but the logo didn't upload.")
        }
      }
      await refreshUser()
      toast.success("You're all set up.")
      navigate("/", { replace: true })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save your company.",
      )
      setSubmitting(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.
              </h1>
              <p className="text-sm text-muted-foreground">
                Let's set up your company. Paste your website and ARIA will fill in
                the details for you to review.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-url">Company website</Label>
              <Input
                id="onboarding-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="acme.com"
                autoFocus
                disabled={extracting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void analyze()
                }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void analyze()}
              disabled={extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing your website…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Analyze
                </>
              )}
            </Button>
            {extracting && (
              <p className="text-center text-xs text-muted-foreground">
                Reading your site and gathering company details. This can take up
                to a minute.
              </p>
            )}
          </div>
        )

      case 1:
        return (
          <StepShell
            title="Confirm your company"
            description="We pulled these from your website. Fix anything that looks off."
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          >
            <div className="space-y-2">
              <Label htmlFor="f-name">Company name</Label>
              <Input
                id="f-name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <IndustryCombobox
                value={form.industry}
                onChange={set("industry")}
                options={INDUSTRIES}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-linkedin">LinkedIn URL</Label>
              <Input
                id="f-linkedin"
                value={form.linkedin_url}
                onChange={(e) => set("linkedin_url")(e.target.value)}
                placeholder="https://www.linkedin.com/company/…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="f-city">City</Label>
                <Input
                  id="f-city"
                  value={form.city}
                  onChange={(e) => set("city")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-country">Country</Label>
                <Input
                  id="f-country"
                  value={form.country}
                  onChange={(e) => set("country")(e.target.value)}
                />
              </div>
            </div>
          </StepShell>
        )

      case 2:
        return (
          <StepShell
            title="What your company does"
            description="Review the summary ARIA will use in your outreach."
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          >
            <div className="space-y-2">
              <Label htmlFor="f-vp">What does your company do?</Label>
              <Textarea
                id="f-vp"
                value={form.value_proposition}
                onChange={(e) => set("value_proposition")(e.target.value)}
                rows={4}
              />
            </div>
            {/* Language tone is extracted and saved silently (form.tone_description);
                it is intentionally not shown to the user here. */}
          </StepShell>
        )

      case 3:
        return (
          <StepShell
            title="Your branding"
            description="Here's the logo we found. Replace it if you'd prefer a different one."
            onBack={() => setStep(2)}
            onNext={() => void finish()}
            nextLabel="Finish setup"
            submitting={submitting}
          >
            <LogoPicker
              previewUrl={logoPreview}
              onPick={pickLogo}
              onRemove={removeLogo}
            />
          </StepShell>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <OnboardingHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-8">
        <div className="w-full max-w-3xl">
          {step > 0 && (
            <div className="mb-10">
              <WizardStepper steps={STEPS} current={step} />
            </div>
          )}
        </div>
        <div className="flex w-full max-w-xl flex-1 items-start justify-center">
          <div className="w-full">{renderStep()}</div>
        </div>
      </main>
    </div>
  )
}
