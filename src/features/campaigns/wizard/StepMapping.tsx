import { useMemo, useState } from "react"
import { ArrowLeft, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { campaignUploadService } from "@/services/campaign-upload.service"
import { ApiError } from "@/services/http"
import type {
  UploadResult,
  UploadedCompanyInput,
  UploadedContactInput,
  UploadedRow,
} from "@/types/campaign-upload"
import {
  COMPANY_ATTRIBUTES,
  COMPANY_DOMAIN_ATTR,
  COMPANY_LINKEDIN_ATTR,
  CONTACT_ATTRIBUTES,
  SKIP_MAPPING,
  guessAttribute,
} from "./attributes"
import type { ParsedCsv } from "./csv"

interface StepMappingProps {
  campaignId: number
  parsed: ParsedCsv
  onSaved: (result: UploadResult) => void
  onBack: () => void
}

/**
 * Step 3 — map each spreadsheet column onto a contact/company attribute. A company
 * domain or LinkedIn URL is all that's required: contacts may arrive without
 * addresses, or the file may name no people at all, and the step that follows
 * fills in whichever is missing.
 */
export function StepMapping({ campaignId, parsed, onSaved, onBack }: StepMappingProps) {
  const [mapping, setMapping] = useState<string[]>(() =>
    parsed.headers.map((header) => guessAttribute(header)),
  )
  const [saving, setSaving] = useState(false)

  const mappedSet = useMemo(
    () => new Set(mapping.filter((m) => m && m !== SKIP_MAPPING)),
    [mapping],
  )
  // Identifying the company is the whole requirement — it is what everything
  // downstream searches on, and without it a row can't be filled in.
  const valid =
    mappedSet.has(COMPANY_DOMAIN_ATTR) || mappedSet.has(COMPANY_LINKEDIN_ATTR)

  function setColumn(index: number, value: string) {
    setMapping((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function buildRows(): UploadedRow[] {
    return parsed.rows
      .map((cells) => {
        const contact: Record<string, string> = {}
        const company: Record<string, string> = {}
        mapping.forEach((attr, i) => {
          if (!attr || attr === SKIP_MAPPING) return
          const value = cells[i]
          if (value === "") return
          const [entity, field] = attr.split(":")
          if (entity === "contact") contact[field] = value
          else company[field] = value
        })
        // Derive full_name from first + last name when it wasn't mapped (or the
        // full_name cell for this row was blank).
        if (!contact.full_name) {
          const derived = [contact.first_name, contact.last_name]
            .filter(Boolean)
            .join(" ")
          if (derived) contact.full_name = derived
        }
        return {
          contact: contact as UploadedContactInput,
          company: company as UploadedCompanyInput,
        }
      })
      .filter(
        (row) =>
          Object.keys(row.contact).length > 0 ||
          Object.keys(row.company).length > 0,
      )
  }

  async function handleConfirm() {
    const rows = buildRows()
    if (rows.length === 0) {
      toast.error("No rows to import. Check your column mapping.")
      return
    }
    setSaving(true)
    try {
      // The next step reports what landed — including any rows the exclusion
      // list dropped — so there's no toast to duplicate it here.
      onSaved(await campaignUploadService.upload(campaignId, { rows }))
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save contacts.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Match each column from your file to a contact or company attribute.
        Columns you leave as <span className="font-medium">Don&apos;t import</span>{" "}
        are ignored.
      </p>

      <div className="space-y-3">
        {parsed.headers.map((header, index) => {
          const sample = parsed.rows[0]?.[index] ?? ""
          return (
            <div
              key={`${header}-${index}`}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 sm:w-1/2">
                <p className="truncate text-sm font-medium">
                  {header || <span className="text-muted-foreground">(unnamed column)</span>}
                </p>
                {sample && (
                  <p className="truncate text-xs text-muted-foreground">
                    e.g. {sample}
                  </p>
                )}
              </div>
              <div className="sm:w-1/2">
                <AttributeSelect
                  value={mapping[index]}
                  usedElsewhere={mappedSet}
                  currentValue={mapping[index]}
                  onChange={(value) => setColumn(index, value)}
                  disabled={saving}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-medium">Required to continue</p>
        <ul className="space-y-1">
          <RequirementRow
            met={valid}
            label="A company domain or LinkedIn URL"
          />
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Names and email addresses are optional. We&apos;ll find work email
          addresses for contacts without one, and find contacts for companies
          that arrive with none.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={saving || !valid}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Confirm & save
        </Button>
      </div>
    </div>
  )
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        met ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {met ? (
        <Check className="size-4 text-[#1c8676]" />
      ) : (
        <X className="size-4 text-muted-foreground" />
      )}
      {label}
    </li>
  )
}

interface AttributeSelectProps {
  value: string
  currentValue: string
  usedElsewhere: Set<string>
  onChange: (value: string) => void
  disabled?: boolean
}

/** A grouped select of contact/company attributes for one spreadsheet column. Attributes
 * already mapped by another column are disabled to prevent duplicates. */
function AttributeSelect({
  value,
  currentValue,
  usedElsewhere,
  onChange,
  disabled,
}: AttributeSelectProps) {
  const isDisabled = (attr: string) =>
    attr !== currentValue && usedElsewhere.has(attr)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an attribute" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SKIP_MAPPING}>Don&apos;t import</SelectItem>
        <SelectGroup>
          <SelectLabel>Contact</SelectLabel>
          {CONTACT_ATTRIBUTES.map((attr) => (
            <SelectItem key={attr.value} value={attr.value} disabled={isDisabled(attr.value)}>
              {attr.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Company</SelectLabel>
          {COMPANY_ATTRIBUTES.map((attr) => (
            <SelectItem key={attr.value} value={attr.value} disabled={isDisabled(attr.value)}>
              {attr.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
