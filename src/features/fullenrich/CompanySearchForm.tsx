import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { TextField } from "@/components/form/TextField"
import { MultiComboboxField } from "@/components/form/MultiComboboxField"
import { INDUSTRIES } from "@/features/companies/industries"
import {
  COMPANY_TYPES,
  HEADCOUNT_RANGES,
  HEADCOUNT_RANGE_LABELS,
  REVENUE_RANGES,
} from "@/features/companies/company-filters"
import type {
  FullEnrichBracketFilter,
  FullEnrichCompanySearchRequest,
  FullEnrichRangeFilter,
  FullEnrichValueFilter,
} from "@/types/fullenrich"

const numericString = z
  .string()
  .refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), "Must be a whole number")

const searchSchema = z.object({
  keywords: z.string(),
  specialties: z.string(),
  industries: z.array(z.string()),
  types: z.array(z.string()),
  headcount_ranges: z.array(z.string()),
  headquarters_locations: z.string(),
  revenue_ranges: z.array(z.string()),
  founded_year_min: numericString,
  founded_year_max: numericString,
})

export type CompanySearchFormValues = z.infer<typeof searchSchema>

const DEFAULTS: CompanySearchFormValues = {
  keywords: "",
  specialties: "",
  industries: [],
  types: [],
  headcount_ranges: [],
  headquarters_locations: "",
  revenue_ranges: [],
  founded_year_min: "",
  founded_year_max: "",
}

/** Split a comma-separated string into trimmed, non-empty tokens. */
function splitTokens(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Build value filters from a comma-separated string, or undefined when empty. */
function valueFilters(value: string): FullEnrichValueFilter[] | undefined {
  const tokens = splitTokens(value)
  return tokens.length ? tokens.map((value) => ({ value })) : undefined
}

/** Build value filters from a selected list, or undefined when empty. */
function listFilters(values: string[]): FullEnrichValueFilter[] | undefined {
  return values.length ? values.map((value) => ({ value })) : undefined
}

/** Map selected headcount buckets to FullEnrich `headcounts` min/max ranges. */
function headcountFilters(labels: string[]): FullEnrichRangeFilter[] | undefined {
  const ranges = labels
    .map((label) => HEADCOUNT_RANGES.find((r) => r.label === label))
    .filter((r): r is (typeof HEADCOUNT_RANGES)[number] => r != null)
    .map((r) => (r.max != null ? { min: r.min, max: r.max } : { min: r.min }))
  return ranges.length ? ranges : undefined
}

function bracketFilters(values: string[]): FullEnrichBracketFilter[] | undefined {
  return values.length ? values.map((value) => ({ value })) : undefined
}

function rangeFilter(min: string, max: string): FullEnrichRangeFilter[] | undefined {
  const range: FullEnrichRangeFilter = {}
  if (min.trim() !== "") range.min = Number(min)
  if (max.trim() !== "") range.max = Number(max)
  return "min" in range || "max" in range ? [range] : undefined
}

function toRequest(
  values: CompanySearchFormValues,
): FullEnrichCompanySearchRequest {
  const body: FullEnrichCompanySearchRequest = {
    keywords: valueFilters(values.keywords),
    specialties: valueFilters(values.specialties),
    industries: listFilters(values.industries),
    types: listFilters(values.types),
    headquarters_locations: valueFilters(values.headquarters_locations),
    revenue_ranges: bracketFilters(values.revenue_ranges),
    founded_years: rangeFilter(values.founded_year_min, values.founded_year_max),
    headcounts: headcountFilters(values.headcount_ranges),
  }

  // Drop undefined keys so the request body stays clean.
  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  ) as FullEnrichCompanySearchRequest
}

interface CompanySearchFormProps {
  onSearch: (request: FullEnrichCompanySearchRequest) => void
  onReset: () => void
  submitting?: boolean
}

export function CompanySearchForm({
  onSearch,
  onReset,
  submitting,
}: CompanySearchFormProps) {
  const form = useForm<CompanySearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: DEFAULTS,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSearch(toRequest(values)))}
        className="space-y-5"
      >
        <div className="space-y-4">
          <TextField
            control={form.control}
            name="keywords"
            label="Keywords"
            placeholder="artificial intelligence, llm"
            description="Comma-separated keywords from the company description."
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="specialties"
            label="Specialties"
            placeholder="machine learning, safety"
            description="Comma-separated specialties."
            disabled={submitting}
          />
          <MultiComboboxField
            control={form.control}
            name="industries"
            label="Industries"
            options={INDUSTRIES}
            placeholder="Select industries…"
            searchPlaceholder="Search industries…"
            disabled={submitting}
          />
          <MultiComboboxField
            control={form.control}
            name="types"
            label="Company types"
            options={COMPANY_TYPES}
            placeholder="Select company types…"
            searchPlaceholder="Search company types…"
            disabled={submitting}
          />
          <MultiComboboxField
            control={form.control}
            name="headcount_ranges"
            label="Headcount range"
            options={HEADCOUNT_RANGE_LABELS}
            placeholder="Select headcount ranges…"
            searchPlaceholder="Search ranges…"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="headquarters_locations"
            label="Headquarters locations"
            placeholder="San Francisco, United States"
            description="Comma-separated city / region / country names."
            disabled={submitting}
          />
          <MultiComboboxField
            control={form.control}
            name="revenue_ranges"
            label="Revenue ranges"
            options={REVENUE_RANGES}
            placeholder="Select revenue ranges…"
            searchPlaceholder="Search ranges…"
            disabled={submitting}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="founded_year_min"
            label="Founded year (min)"
            type="number"
            placeholder="2010"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="founded_year_max"
            label="Founded year (max)"
            type="number"
            placeholder="2024"
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              form.reset(DEFAULTS)
              onReset()
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search
          </Button>
        </div>
      </form>
    </Form>
  )
}
