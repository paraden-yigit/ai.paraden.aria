import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/services/http"
import type { Company } from "@/types/company"
import type { SpreadsheetRow } from "@/lib/spreadsheet"
import { IMPORT_IGNORE, runImport, type ImportSummary } from "./runImport"

/** Value used when a file column should not be mapped to any attribute. */
const IGNORE = IMPORT_IGNORE

interface AttributeOption {
  /** Stable, namespaced value (e.g. `contact:full_name`) — unique across groups. */
  value: string
  label: string
}

/** Contact attributes a file column can map to (mirrors ContactCreate). */
const CONTACT_ATTRIBUTES: AttributeOption[] = [
  { value: "contact:full_name", label: "Full name" },
  { value: "contact:first_name", label: "First name" },
  { value: "contact:last_name", label: "Last name" },
  { value: "contact:job_title", label: "Job title" },
  { value: "contact:seniority", label: "Seniority" },
  { value: "contact:department", label: "Department" },
  { value: "contact:linkedin_url", label: "LinkedIn URL" },
  { value: "contact:city", label: "City" },
  { value: "contact:region", label: "Region" },
  { value: "contact:country", label: "Country" },
  { value: "contact:email", label: "Email" },
  { value: "contact:phone", label: "Phone" },
]

/** Company attributes a file column can map to (mirrors CompanyCreate). */
const COMPANY_ATTRIBUTES: AttributeOption[] = [
  { value: "company:name", label: "Company name" },
  { value: "company:domain", label: "Domain" },
  { value: "company:description", label: "Description" },
  { value: "company:year_founded", label: "Year founded" },
  { value: "company:company_type", label: "Company type" },
  { value: "company:headcount", label: "Headcount" },
  { value: "company:headcount_range", label: "Headcount range" },
  { value: "company:industry", label: "Industry" },
  { value: "company:linkedin_url", label: "LinkedIn URL" },
  { value: "company:hq_city", label: "HQ city" },
  { value: "company:hq_region", label: "HQ region" },
  { value: "company:hq_country", label: "HQ country" },
]

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * Best-effort initial mapping: match a file column to an attribute whose field
 * key or label normalizes to the same string (e.g. "Full Name" → full_name).
 */
function guessMapping(columns: string[]): Record<string, string> {
  const all = [...CONTACT_ATTRIBUTES, ...COMPANY_ATTRIBUTES]
  const mapping: Record<string, string> = {}
  for (const column of columns) {
    const key = normalize(column)
    const match = all.find((attr) => {
      const field = attr.value.split(":")[1]
      return normalize(field) === key || normalize(attr.label) === key
    })
    mapping[column] = match?.value ?? IGNORE
  }
  return mapping
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  columns: string[]
  rows: SpreadsheetRow[]
  /** The client's current companies, for de-duplicating during import. */
  existingCompanies: Company[]
  /** Called after a completed import so the parent can refresh its list. */
  onImported: () => void
}

export function ImportDialog({
  open,
  onOpenChange,
  fileName,
  columns,
  rows,
  existingCompanies,
  onImported,
}: ImportDialogProps) {
  // Seeded once on mount; the parent remounts this dialog per file via `key`.
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    guessMapping(columns),
  )
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportSummary | null>(null)

  const mappedCount = useMemo(
    () => Object.values(mapping).filter((value) => value !== IGNORE).length,
    [mapping],
  )

  async function handleImport() {
    setImporting(true)
    try {
      const summary = await runImport(rows, mapping, existingCompanies)
      setResult(summary)
      onImported()
      const { companiesCreated, contactsCreated } = summary
      toast.success(
        `Imported ${contactsCreated} contact${contactsCreated === 1 ? "" : "s"} ` +
          `and ${companiesCreated} compan${companiesCreated === 1 ? "y" : "ies"}.`,
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Import failed.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{result ? "Import complete" : "Map columns"}</DialogTitle>
          <DialogDescription>
            {result
              ? "Here's what was imported from your file."
              : "Match each column from your file to a contact or company attribute. Leave a column as “Don’t import” to skip it."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          <span className="font-medium">{fileName}</span>
          <span className="text-muted-foreground">
            · {columns.length} columns · {rows.length} rows
          </span>
        </div>

        {result ? (
          <ImportResultView result={result} />
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-1 text-xs font-medium text-muted-foreground">
              <span>File column</span>
              <span />
              <span>Maps to</span>
            </div>

            <div className="max-h-[50vh] space-y-2 overflow-y-auto px-1">
              {columns.map((column) => (
                <div
                  key={column}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3"
                >
                  <span className="truncate text-sm font-medium" title={column}>
                    {column}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={mapping[column] ?? IGNORE}
                    onValueChange={(value) =>
                      setMapping((prev) => ({ ...prev, [column]: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select attribute…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value={IGNORE}>Don’t import</SelectItem>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Contact</SelectLabel>
                        {CONTACT_ATTRIBUTES.map((attr) => (
                          <SelectItem key={attr.value} value={attr.value}>
                            {attr.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Company</SelectLabel>
                        {COMPANY_ATTRIBUTES.map((attr) => (
                          <SelectItem key={attr.value} value={attr.value}>
                            {attr.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <span className="mr-auto self-center text-sm text-muted-foreground">
                {mappedCount} of {columns.length} columns mapped
              </span>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={mappedCount === 0 || rows.length === 0 || importing}
              >
                {importing && <Loader2 className="size-4 animate-spin" />}
                {importing ? "Importing…" : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImportResultView({ result }: { result: ImportSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
        <span>
          Created <strong>{result.contactsCreated}</strong> contact
          {result.contactsCreated === 1 ? "" : "s"} and{" "}
          <strong>{result.companiesCreated}</strong> compan
          {result.companiesCreated === 1 ? "y" : "ies"}
          {result.skipped > 0 ? `, skipped ${result.skipped} row${result.skipped === 1 ? "" : "s"}.` : "."}
        </span>
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1 rounded-md border px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="size-4 text-amber-500" />
            Some rows had issues
          </div>
          <ul className="max-h-[30vh] list-disc space-y-1 overflow-y-auto pl-5 text-sm text-muted-foreground">
            {result.errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
