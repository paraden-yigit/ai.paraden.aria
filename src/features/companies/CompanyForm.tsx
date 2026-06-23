import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { TextareaField } from "@/components/form/TextareaField"
import { SelectField, type SelectOption } from "@/components/form/SelectField"
import { ComboboxField } from "@/components/form/ComboboxField"
import { INDUSTRIES } from "@/features/companies/industries"
import type { Company, CompanyCreate } from "@/types/company"

// Stored as strings in the form (RHF/shadcn contract); empty means "not set".
const numericString = z
  .string()
  .refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), "Must be a whole number")

const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  domain: z.string().min(1, "Domain is required").max(255),
  industry: z.string(),
  company_type: z.string(),
  headcount_range: z.string(),
  headcount: numericString,
  year_founded: numericString,
  linkedin_url: z.string(),
  hq_city: z.string(),
  hq_region: z.string(),
  hq_country: z.string(),
  description: z.string(),
})

type CompanyFormValues = z.infer<typeof companySchema>

const COMPANY_TYPES: string[] = [
  "Partnership",
  "Nonprofit",
  "Educational",
  "Privately Held",
  "Public Company",
  "Self-Owned",
  "Self-Employed",
  "Government Agency",
]

const HEADCOUNT_RANGE_OPTIONS: SelectOption[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001+",
].map((r) => ({ value: r, label: r }))

function toFormValues(company?: Company): CompanyFormValues {
  return {
    name: company?.name ?? "",
    domain: company?.domain ?? "",
    industry: company?.industry ?? "",
    company_type: company?.company_type ?? "",
    headcount_range: company?.headcount_range ?? "",
    headcount: company?.headcount != null ? String(company.headcount) : "",
    year_founded: company?.year_founded != null ? String(company.year_founded) : "",
    linkedin_url: company?.linkedin_url ?? "",
    hq_city: company?.hq_city ?? "",
    hq_region: company?.hq_region ?? "",
    hq_country: company?.hq_country ?? "",
    description: company?.description ?? "",
  }
}

function nullableString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : Number(trimmed)
}

function toPayload(values: CompanyFormValues): CompanyCreate {
  return {
    name: values.name.trim(),
    domain: values.domain.trim(),
    industry: nullableString(values.industry),
    company_type: nullableString(values.company_type),
    headcount_range: nullableString(values.headcount_range),
    headcount: nullableNumber(values.headcount),
    year_founded: nullableNumber(values.year_founded),
    linkedin_url: nullableString(values.linkedin_url),
    hq_city: nullableString(values.hq_city),
    hq_region: nullableString(values.hq_region),
    hq_country: nullableString(values.hq_country),
    description: nullableString(values.description),
  }
}

interface CompanyFormProps {
  /** Existing company when editing; omit for create. */
  company?: Company
  onSubmit: (payload: CompanyCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function CompanyForm({
  company,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save changes",
}: CompanyFormProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toFormValues(company),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Name" disabled={submitting} />
          <TextField
            control={form.control}
            name="domain"
            label="Domain"
            placeholder="anthropic.com"
            disabled={submitting}
          />
          <ComboboxField
            control={form.control}
            name="industry"
            label="Industry"
            options={INDUSTRIES}
            placeholder="Select industry…"
            searchPlaceholder="Search industries…"
            disabled={submitting}
          />
          <ComboboxField
            control={form.control}
            name="company_type"
            label="Company type"
            options={COMPANY_TYPES}
            placeholder="Select company type…"
            searchPlaceholder="Search company types…"
            disabled={submitting}
          />
          <SelectField
            control={form.control}
            name="headcount_range"
            label="Headcount range"
            options={HEADCOUNT_RANGE_OPTIONS}
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="headcount"
            label="Headcount"
            type="number"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="year_founded"
            label="Year founded"
            type="number"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="linkedin_url"
            label="LinkedIn URL"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="hq_city"
            label="HQ city"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="hq_region"
            label="HQ region"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="hq_country"
            label="HQ country"
            disabled={submitting}
          />
        </div>

        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          disabled={submitting}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
