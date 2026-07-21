import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { WizardStepper, type WizardStep } from "@/features/campaigns/wizard/WizardStepper"
import { StepFrame } from "@/features/products/wizard/StepFrame"
import { PainPointModal } from "@/features/products/wizard/PainPointModal"
import { FileCategoryModal } from "@/features/products/wizard/FileCategoryModal"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import {
  fileCategoryLabel,
  PERSONA_MAX,
  PERSONA_MIN,
  type PainPointInput,
} from "@/types/product"

// Accepted upload types (kept in sync with the API's allowed list).
const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.rtf,.jpg,.jpeg,.png," +
  "application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-excel,text/plain,text/markdown,text/rtf,application/rtf," +
  "image/jpeg,image/png"

const STEPS: WizardStep[] = [
  { title: "Name" },
  { title: "Value" },
  { title: "USP" },
  { title: "Pain points" },
  { title: "ROI" },
  { title: "Personas" },
  { title: "Files" },
]

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6
const LAST_STEP: Step = 6

/** A file staged for upload, with the category the user tagged it with. */
interface StagedFile {
  file: File
  category: string
}

/**
 * Full-page product creation wizard (mirrors the campaign wizard's chrome). All
 * answers are held in local state and nothing is persisted until the final step:
 * completing creates the product, its pain points (in one call), then its
 * personas and files. On success the user lands on the product detail page,
 * which opens the ICP approval modal.
 */
export function NewProductPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState("")
  const [valueProp, setValueProp] = useState("")
  const [usp, setUsp] = useState("")
  const [roi, setRoi] = useState("")
  const [painPoints, setPainPoints] = useState<PainPointInput[]>([])
  const [personas, setPersonas] = useState<string[]>([])
  const [files, setFiles] = useState<StagedFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Pain point modal (add or edit-by-index).
  const [painModalOpen, setPainModalOpen] = useState(false)
  const [editingPain, setEditingPain] = useState<number | null>(null)

  // Persona modal (single job title).
  const [personaModalOpen, setPersonaModalOpen] = useState(false)
  const [personaTitle, setPersonaTitle] = useState("")

  // File flow: a pending file awaits a category in the modal before it's added.
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  function close() {
    navigate("/products")
  }

  function next() {
    setStep((s) => Math.min(LAST_STEP, s + 1) as Step)
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step)
  }

  // --- Pain points ---
  function savePainPoint(value: PainPointInput) {
    setPainPoints((prev) => {
      if (editingPain === null) return [...prev, value]
      const copy = [...prev]
      copy[editingPain] = value
      return copy
    })
    setEditingPain(null)
  }

  // --- Personas ---
  function addPersona() {
    const title = personaTitle.trim()
    if (!title) return
    if (personas.some((p) => p.toLowerCase() === title.toLowerCase())) {
      toast.error("That job title is already on the list.")
      return
    }
    setPersonas((prev) => [...prev, title])
    setPersonaTitle("")
    setPersonaModalOpen(false)
  }

  // --- Files ---
  function pickFile(file: File | undefined) {
    if (!file) return
    setPendingFile(file)
  }
  function confirmFile(category: string) {
    if (pendingFile) {
      setFiles((prev) => [...prev, { file: pendingFile, category }])
    }
    setPendingFile(null)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    pickFile(event.dataTransfer.files?.[0])
  }
  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return
    event.preventDefault()
    if (!dragging) setDragging(true)
  }
  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
  }

  // --- Commit ---
  async function finish() {
    setSubmitting(true)
    try {
      const product = await productService.create({
        name: name.trim(),
        value_proposition: valueProp.trim() || null,
        usp: usp.trim() || null,
        demonstrable_roi: roi.trim() || null,
        pain_points: painPoints,
      })

      // Personas and files are added after the product exists. Best-effort: a
      // single failure is surfaced but doesn't discard the created product.
      let failures = 0
      for (const title of personas) {
        try {
          await productService.addPersona(product.id, title)
        } catch {
          failures += 1
        }
      }
      for (const staged of files) {
        try {
          await productService.uploadFile(
            product.id,
            staged.file,
            staged.category,
          )
        } catch {
          failures += 1
        }
      }

      if (failures > 0) {
        toast.warning(
          `Product created, but ${failures} item${failures === 1 ? "" : "s"} couldn't be saved.`,
        )
      } else {
        toast.success("Product created.")
      }
      // Land on the detail page and open the ICP approval flow.
      navigate(`/products/${product.id}`, { state: { generateIcp: true } })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create the product.",
      )
      setSubmitting(false)
    }
  }

  // List-heavy steps use the wider column; focused form steps read narrower.
  const wideStep = step === 3 || step === 5 || step === 6

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepFrame
            title="What is your product name?"
            subline="The name as you'd like it to appear in outreach and messaging."
            onNext={next}
            nextDisabled={name.trim() === ""}
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Widget"
              maxLength={255}
            />
          </StepFrame>
        )
      case 1:
        return (
          <StepFrame
            title="What is the product's value proposition?"
            subline="In a sentence or two, what does your product do and what outcome does it deliver for customers?"
            onBack={back}
            onNext={next}
          >
            <Textarea
              autoFocus
              rows={5}
              value={valueProp}
              onChange={(e) => setValueProp(e.target.value)}
              placeholder="What your product does and the outcome it delivers."
            />
          </StepFrame>
        )
      case 2:
        return (
          <StepFrame
            title="What is the product's USP?"
            subline="What sets you apart from alternatives, the one thing competitors can't easily claim?"
            onBack={back}
            onNext={next}
          >
            <Textarea
              autoFocus
              rows={5}
              value={usp}
              onChange={(e) => setUsp(e.target.value)}
              placeholder="Your unique selling proposition."
            />
          </StepFrame>
        )
      case 3:
        return (
          <StepFrame
            title="What pain points does your product solve?"
            subline="For each, share the challenge your prospect faces, why it matters to them, and how your product helps. Add as many as apply (2–3 is ideal)."
            onBack={back}
            onNext={next}
          >
            <div className="space-y-3">
              {painPoints.length > 0 && (
                <ul className="space-y-3">
                  {painPoints.map((pp, index) => (
                    <li
                      key={index}
                      className="rounded-lg border p-4 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{pp.name}</p>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            onClick={() => {
                              setEditingPain(index)
                              setPainModalOpen(true)
                            }}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit pain point</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              setPainPoints((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Remove pain point</span>
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Challenge:
                        </span>{" "}
                        {pp.challenge}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Why it matters:
                        </span>{" "}
                        {pp.why_it_matters}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          How it helps:
                        </span>{" "}
                        {pp.how_it_helps}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPain(null)
                  setPainModalOpen(true)
                }}
              >
                <Plus className="size-4" />
                Add pain point
              </Button>
            </div>
          </StepFrame>
        )
      case 4:
        return (
          <StepFrame
            title="What demonstrable ROI can you share with us?"
            subline={
              'Case studies, quantitative results, or client outcomes we can reference — e.g. "cut onboarding time by 40%."'
            }
            onBack={back}
            onNext={next}
          >
            <Textarea
              autoFocus
              rows={6}
              value={roi}
              onChange={(e) => setRoi(e.target.value)}
              placeholder="Case studies, quantitative results, or client outcomes."
            />
          </StepFrame>
        )
      case 5:
        return (
          <StepFrame
            title="Who are we reaching out to?"
            subline="List 5 job titles that represent your ideal buyers so we can match them to enriched contacts."
            onBack={back}
            onNext={next}
          >
            <div className="space-y-3">
              {personas.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {personas.map((title, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                      >
                        <UserRound className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          setPersonas((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove job title</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPersonaTitle("")
                    setPersonaModalOpen(true)
                  }}
                  disabled={personas.length >= PERSONA_MAX}
                >
                  <Plus className="size-4" />
                  Add job title
                </Button>
                {personas.length > 0 && (
                  <Badge variant="secondary">
                    {personas.length} of {PERSONA_MAX}
                  </Badge>
                )}
              </div>
              {personas.length > 0 && personas.length < PERSONA_MIN && (
                <p className="text-sm text-muted-foreground">
                  Add at least {PERSONA_MIN} job titles.
                </p>
              )}
            </div>
          </StepFrame>
        )
      case 6:
        return (
          <StepFrame
            title="Upload your supporting files"
            subline="Attach anything that helps us write better outreach. After each upload, you'll be asked to tag it with a category so we know how to use it."
            onBack={back}
            onNext={finish}
            nextLabel="Create product"
            busy={submitting}
          >
            <div
              className="relative space-y-4"
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {dragging && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background/80 text-center backdrop-blur-sm">
                  <Upload className="size-6 text-primary" />
                  <p className="text-sm font-medium">Drop the file to add it</p>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0])
                  e.target.value = ""
                }}
              />

              {files.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {files.map((staged, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {staged.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fileCategoryLabel(staged.category)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/50"
              >
                <Upload className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {files.length > 0 ? "Add another file" : "Add file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  or drag &amp; drop it here
                </span>
              </button>
            </div>
          </StepFrame>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">New product</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={close}
            aria-label="Close and return to products"
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mx-auto mb-8 max-w-3xl">
          <WizardStepper steps={STEPS} current={step} />
        </div>
        <div
          className={cn(
            "rounded-xl border bg-card p-6",
            !wideStep && "mx-auto max-w-2xl",
          )}
        >
          {renderStep()}
        </div>
      </main>

      <PainPointModal
        open={painModalOpen}
        onOpenChange={setPainModalOpen}
        initial={editingPain !== null ? painPoints[editingPain] : null}
        onSave={savePainPoint}
      />

      <FileCategoryModal
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFile(null)
        }}
        fileName={pendingFile?.name ?? null}
        onConfirm={confirmFile}
        onCancel={() => setPendingFile(null)}
      />

      <Dialog open={personaModalOpen} onOpenChange={setPersonaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a job title</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="persona-title">Job title</Label>
            <Input
              id="persona-title"
              autoFocus
              value={personaTitle}
              onChange={(e) => setPersonaTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addPersona()
                }
              }}
              placeholder="e.g. Regional Marketing Director"
              maxLength={255}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPersonaModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={addPersona}
              disabled={personaTitle.trim() === ""}
            >
              Add job title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
