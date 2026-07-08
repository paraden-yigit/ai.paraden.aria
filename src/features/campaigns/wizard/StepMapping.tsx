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
  UploadedCompanyInput,
  UploadedContactInput,
  UploadedRow,
} from "@/types/campaign-upload"
import {
  COMPANY_ATTRIBUTES,
  COMPANY_DOMAIN_ATTR,
  CONTACT_ATTRIBUTES,
  FIRST_NAME_ATTR,
  FULL_NAME_ATTR,
  LAST_NAME_ATTR,
  LINKEDIN_ATTRS,
  SKIP_MAPPING,
  guessAttribute,
} from "./attributes"
import type { ParsedCsv } from "./csv"

interface StepMappingProps {
  campaignId: number
  parsed: ParsedCsv
  onSaved: () => void
  onBack: () => void
}

/**
 * Step 3 — map each CSV column onto a contact/company attribute. Enforces the
 * step-2 rule (a full name plus a company domain or LinkedIn URL must be mapped)
 * before the mapped rows can be saved to the campaign.
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
  // A full name is covered either directly, or by mapping first + last name
  // (combined into full_name when the rows are built below).
  const hasFullName =
    mappedSet.has(FULL_NAME_ATTR) ||
    (mappedSet.has(FIRST_NAME_ATTR) && mappedSet.has(LAST_NAME_ATTR))
  const hasCompanyIdentity =
    mappedSet.has(COMPANY_DOMAIN_ATTR) ||
    LINKEDIN_ATTRS.some((attr) => mappedSet.has(attr))
  const valid = hasFullName && hasCompanyIdentity

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
      toast.error("No rows to import — check your column mapping.")
      return
    }
    setSaving(true)
    try {
      const result = await campaignUploadService.upload(campaignId, { rows })
      toast.success(
        `Imported ${result.contacts_created} contacts across ${result.companies_created} companies.`,
      )
      onSaved()
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
            met={hasFullName}
            label="A contact full name (or first + last name)"
          />
          <RequirementRow
            met={hasCompanyIdentity}
            label="A company domain or LinkedIn URL"
          />
        </ul>
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
        <Check className="size-4 text-emerald-500" />
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

/** A grouped select of contact/company attributes for one CSV column. Attributes
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
