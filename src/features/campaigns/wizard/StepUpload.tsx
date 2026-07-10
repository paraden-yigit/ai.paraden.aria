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

  // Contacts already uploaded to this campaign (shown when resuming setup).
  const fetchUploaded = useCallback(
    () => campaignUploadService.review(campaignId, "uploaded"),
    [campaignId],
  )
  const { data: uploaded } = useAsync(fetchUploaded, [campaignId])
  const hasUploaded =
    !!uploaded &&
    (uploaded.companies.length > 0 || uploaded.unassigned_contacts.length > 0)

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so the same file can be re-picked after a failure.
    event.target.value = ""
    if (!file) return

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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium text-foreground">Before you upload</p>
        <p className="mt-1 text-muted-foreground">
          Your CSV must include each contact&apos;s{" "}
          <span className="font-medium text-foreground">full name</span> and a way
          to identify their company: a{" "}
          <span className="font-medium text-foreground">company domain</span> or a{" "}
          <span className="font-medium text-foreground">LinkedIn URL</span>. You
          can map the rest of your columns on the next step.
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
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors hover:bg-muted/50 disabled:opacity-60"
        >
          {parsing ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {parsing
              ? "Reading file…"
              : hasUploaded
                ? "Upload another CSV"
                : "Select a CSV file"}
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
