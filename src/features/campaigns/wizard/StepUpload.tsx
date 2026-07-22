import { useCallback, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, FileText, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAsync } from "@/hooks/useAsync"
import { campaignUploadService } from "@/services/campaign-upload.service"
import {
  CompaniesAccordion,
  ContactsTable,
} from "@/features/campaigns/wizard/CompaniesAccordion"
import { parseCsvFile, type ParsedCsv } from "./csv"

interface StepUploadProps {
  campaignId: number
  parsed: ParsedCsv | null
  fileName: string | null
  onParsed: (parsed: ParsedCsv, fileName: string) => void
  onClear: () => void
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
}

/**
 * Step 2 — optionally upload a CSV of contacts. Reminds the user of the required
 * columns first, validates the file, and (when resuming) shows contacts already
 * uploaded to this campaign. Can be skipped.
 */
export function StepUpload({
  campaignId,
  parsed,
  fileName,
  onParsed,
  onClear,
  onContinue,
  onSkip,
  onBack,
}: StepUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Contacts already uploaded to this campaign (shown when resuming setup).
  const fetchUploaded = useCallback(
    () => campaignUploadService.review(campaignId, "uploaded"),
    [campaignId],
  )
  const { data: uploaded } = useAsync(fetchUploaded, [campaignId])
  const hasUploaded =
    !!uploaded &&
    (uploaded.companies.length > 0 || uploaded.unassigned_contacts.length > 0)

  async function processFile(file: File) {
    setParsing(true)
    try {
      const result = await parseCsvFile(file)
      onParsed(result, file.name)
    } catch (err) {
      onClear()
      toast.error(err instanceof Error ? err.message : "Failed to read the file.")
    } finally {
      setParsing(false)
    }
  }

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so the same file can be re-picked after a failure.
    event.target.value = ""
    if (!file) return
    await processFile(file)
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragging(false)
    if (parsing) return
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please drop a CSV file.")
      return
    }
    void processFile(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Upload contacts</h2>
        <p className="text-sm text-muted-foreground">
          Add a CSV of contacts to this campaign, or skip to find matching
          contacts automatically.
        </p>
      </div>

      {hasUploaded && uploaded && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Already uploaded ({uploaded.total_contacts}{" "}
            {uploaded.total_contacts === 1 ? "contact" : "contacts"})
          </p>
          {uploaded.companies.length > 0 && (
            <CompaniesAccordion companies={uploaded.companies} />
          )}
          {uploaded.unassigned_contacts.length > 0 && (
            <div className="rounded-lg border">
              <ContactsTable contacts={uploaded.unassigned_contacts} />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleSelect}
      />

      {parsed && fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {parsed.headers.length} columns · {parsed.rows.length} rows
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={parsing}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              disabled={parsing}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={parsing}
          onDragOver={(event) => {
            event.preventDefault()
            if (!parsing) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors disabled:opacity-60 ${
            dragging ? "border-primary bg-muted/50" : "hover:bg-muted/50"
          }`}
        >
          {parsing ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {parsing
              ? "Reading file…"
              : dragging
                ? "Drop your CSV to upload"
                : hasUploaded
                  ? "Upload another CSV"
                  : "Select or drop a CSV file"}
          </span>
          <span className="text-xs text-muted-foreground">
            {hasUploaded
              ? "add more contacts"
              : "or skip this step to add contacts later"}
          </span>
        </button>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={parsing}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {parsed ? (
            <>
              <Button type="button" variant="outline" onClick={onSkip} disabled={parsing}>
                Skip this step
              </Button>
              <Button type="button" onClick={onContinue} disabled={parsing}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : hasUploaded ? (
            <Button type="button" onClick={onSkip} disabled={parsing}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onSkip} disabled={parsing}>
              Skip this step
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
