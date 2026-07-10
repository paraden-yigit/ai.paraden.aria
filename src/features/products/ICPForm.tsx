import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { TextField } from "@/components/form/TextField"
import { MultiComboboxField } from "@/components/form/MultiComboboxField"
import { INDUSTRIES } from "@/features/companies/industries"
import {
  COMPANY_TYPES,
  REVENUE_RANGES,
} from "@/features/companies/company-filters"
import { COUNTRIES } from "@/features/companies/countries"
import { SENIORITY } from "@/features/companies/seniority"
import {
  JOB_FUNCTIONS,
  JOB_SUBFUNCTIONS,
  FUNCTION_TO_SUBFUNCTIONS,
} from "@/features/companies/job-functions"
import type { Icp, IcpUpdate } from "@/types/icp"

const numericString = z
  .string()
  .refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), "Must be a whole number")

const icpSchema = z.object({
  keywords: z.string(),
  specialties: z.string(),
  industries: z.array(z.string()),
  company_types: z.array(z.string()),
  headcount_min: numericString,
  headcount_max: numericString,
  countries: z.array(z.string()),
  revenue_ranges: z.array(z.string()),
  seniority: z.array(z.string()),
  job_functions: z.array(z.string()),
  job_subfunctions: z.array(z.string()),
})

type ICPFormValues = z.infer<typeof icpSchema>

/** Split a comma-separated string into trimmed, non-empty tokens. */
function splitTokens(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function numberOrNull(value: string): number | null {
  return value.trim() === "" ? null : Number(value)
}

function toDefaults(icp: Icp): ICPFormValues {
  return {
    keywords: icp.keywords.join(", "),
    specialties: icp.specialties.join(", "),
    industries: icp.industries,
    company_types: icp.company_types,
    headcount_min: icp.headcount_min != null ? String(icp.headcount_min) : "",
    headcount_max: icp.headcount_max != null ? String(icp.headcount_max) : "",
    countries: icp.countries,
    revenue_ranges: icp.revenue_ranges,
    seniority: icp.seniority,
    job_functions: icp.job_functions,
    job_subfunctions: icp.job_subfunctions,
  }
}

function toPayload(values: ICPFormValues): IcpUpdate {
  return {
    keywords: splitTokens(values.keywords),
    specialties: splitTokens(values.specialties),
    industries: values.industries,
    company_types: values.company_types,
    headcount_min: numberOrNull(values.headcount_min),
    headcount_max: numberOrNull(values.headcount_max),
    countries: values.countries,
    revenue_ranges: values.revenue_ranges,
    seniority: values.seniority,
    job_functions: values.job_functions,
    job_subfunctions: values.job_subfunctions,
  }
}

interface ICPFormProps {
  icp: Icp
  onSubmit: (payload: IcpUpdate) => void
  submitting?: boolean
  /** Rendered as a secondary button so the user can leave without saving. */
  onCancel?: () => void
}

/** Editable ICP form. Predefined attributes reuse the company-search UX
 * (searchable multi-selects); keywords/specialties are comma-separated text and
 * headcount is a numeric min/max. */
export function ICPForm({ icp, onSubmit, submitting, onCancel }: ICPFormProps) {
  const form = useForm<ICPFormValues>({
    resolver: zodResolver(icpSchema),
    defaultValues: toDefaults(icp),
  })

  // Narrow the subfunction options to the chosen functions (all when none).
  const selectedFunctions = useWatch({
    control: form.control,
    name: "job_functions",
  })
  const subfunctionOptions = !selectedFunctions.length
    ? JOB_SUBFUNCTIONS
    : JOB_SUBFUNCTIONS.filter((s) =>
        selectedFunctions.some((fn) =>
          (FUNCTION_TO_SUBFUNCTIONS[fn] ?? []).includes(s),
        ),
      )

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">The companies we look for</h3>
              <p className="text-sm text-muted-foreground">
                Broaden a field to find more companies; narrow it to find a
                closer match.
              </p>
            </div>
            <MultiComboboxField
              control={form.control}
              name="industries"
              label="Industries"
              options={INDUSTRIES}
              placeholder="Select industries…"
              searchPlaceholder="Search industries…"
              description="The sectors the companies operate in."
              disabled={submitting}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="headcount_min"
                label="Smallest size"
                type="number"
                placeholder="50"
                description="Fewest employees."
                disabled={submitting}
              />
              <TextField
                control={form.control}
                name="headcount_max"
                label="Largest size"
                type="number"
                placeholder="500"
                description="Most employees."
                disabled={submitting}
              />
            </div>
            <MultiComboboxField
              control={form.control}
              name="countries"
              label="Countries"
              options={COUNTRIES}
              placeholder="Select countries…"
              searchPlaceholder="Search countries…"
              description="Where the companies are based."
              disabled={submitting}
            />
            <MultiComboboxField
              control={form.control}
              name="revenue_ranges"
              label="Yearly revenue"
              options={REVENUE_RANGES}
              placeholder="Select revenue ranges…"
              searchPlaceholder="Search ranges…"
              description="Roughly how much they make a year. Leave empty for any."
              disabled={submitting}
            />
            <MultiComboboxField
              control={form.control}
              name="company_types"
              label="Company types"
              options={COMPANY_TYPES}
              placeholder="Select company types…"
              searchPlaceholder="Search company types…"
              description="Ownership style, like privately held or public."
              disabled={submitting}
            />
            <TextField
              control={form.control}
              name="keywords"
              label="Themes"
              placeholder="artificial intelligence, fintech"
              description="Words that describe the companies you want, separated by commas."
              disabled={submitting}
            />
            <TextField
              control={form.control}
              name="specialties"
              label="Specialties"
              placeholder="machine learning, payments"
              description="What those companies are good at, separated by commas."
              disabled={submitting}
            />
          </section>

          <Separator className="lg:hidden" />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">The people we contact</h3>
              <p className="text-sm text-muted-foreground">
                Who at those companies the outreach is written to.
              </p>
            </div>
            <MultiComboboxField
              control={form.control}
              name="seniority"
              label="Seniority"
              options={SENIORITY}
              placeholder="Select seniority levels…"
              searchPlaceholder="Search seniority…"
              description="How senior the people you want to reach are."
              disabled={submitting}
            />
            <MultiComboboxField
              control={form.control}
              name="job_functions"
              label="Departments"
              options={JOB_FUNCTIONS}
              placeholder="Select departments…"
              searchPlaceholder="Search departments…"
              description="Where in the company they work."
              disabled={submitting}
            />
            <MultiComboboxField
              control={form.control}
              name="job_subfunctions"
              label="Specialisms"
              options={subfunctionOptions}
              placeholder="Select specialisms…"
              searchPlaceholder="Search specialisms…"
              description="Narrower roles within those departments. Leave broad if unsure."
              disabled={submitting}
            />
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Back to overview
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
