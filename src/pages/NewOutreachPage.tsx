import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Rocket, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WizardStepper, type WizardStep } from "@/components/WizardStepper"
import { StepFrame } from "@/features/outreach/wizard/StepFrame"
import { StepApproach } from "@/features/outreach/wizard/StepApproach"
import { StepCta } from "@/features/outreach/wizard/StepCta"
import { StepList } from "@/features/outreach/wizard/StepList"
import { StepReview } from "@/features/outreach/wizard/StepReview"
import { StepSequence } from "@/features/outreach/wizard/StepSequence"
import { useProductOptions } from "@/hooks/useProductOptions"
import { outreachService } from "@/services/outreach.service"
import type { DraftStep, OutreachRun } from "@/types/outreach"

const STEPS: WizardStep[] = [
  { title: "Details" },
  { title: "List" },
  { title: "Sequence" },
  { title: "Call to action" },
  { title: "Approach" },
  { title: "Review" },
]

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
        setStep(Math.min(Math.max(existing.step - 1, 0), STEPS.length - 1))
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
      if (step === 4) {
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
        step: Math.min(step + 2, STEPS.length),
        sequence_touches: run.sequence_touches ?? undefined,
        sequence_advancer_gap: run.sequence_advancer_gap ?? undefined,
        sequence_closer_gap: run.sequence_closer_gap ?? undefined,
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
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
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
    if (step === 0) return Boolean(name.trim() && productId)
    if (step === 2) return Boolean(run?.sequence_touches)
    if (step === 3) return Boolean(run?.cta_type?.type)
    if (step === 4) {
      const needed = run?.sequence_touches ?? 0
      return Object.keys(chosen).length >= needed && needed > 0
    }
    return true
  })()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">New outreach</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {run?.name || name || "Untitled run"}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={() => navigate("/campaigns")}
        >
          <X className="size-4" />
        </Button>
      </header>

      <WizardStepper steps={STEPS} current={step} />

      <main className="flex-1">
        {step === 0 && (
          <StepFrame
            title="What are you selling, and what shall we call this?"
            blurb="The product's value proposition, differentiator, pain points and supporting documents are most of what the emails are written from."
          >
            <Card>
              <CardContent className="grid gap-4 pt-6">
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
              </CardContent>
            </Card>
          </StepFrame>
        )}

        {step === 1 && run && <StepList runId={run.id} />}
        {step === 2 && run && <StepSequence run={run} onChange={patch} />}
        {step === 3 && run && <StepCta run={run} onChange={patch} />}
        {step === 4 && run && (
          <StepApproach
            runId={run.id}
            chosen={chosen}
            onChoose={handleChoose}
          />
        )}
        {step === 5 && run && (
          <StepReview run={run} onRunChange={setRun} />
        )}
      </main>

      <footer className="flex items-center justify-between gap-3 border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || saving}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => void next()} disabled={!canAdvance || saving}>
            {saving ? "Saving…" : "Continue"}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate("/campaigns")}>
            <Rocket className="size-4" />
            Done
          </Button>
        )}
      </footer>
    </div>
  )
}
