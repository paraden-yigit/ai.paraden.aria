import type { ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { TextField } from "@/components/form/TextField"
import { MultiComboboxField } from "@/components/form/MultiComboboxField"
import { INDUSTRIES } from "@/features/companies/industries"
import { COMPANY_TYPES } from "@/features/companies/company-filters"
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
  seniority: z.array(z.string()),
  seniority_primary: z.array(z.string()),
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
    seniority: icp.seniority,
    seniority_primary: icp.seniority_primary ?? [],
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
    seniority: values.seniority,
    // Primary is always a subset of the accepted seniority set.
    seniority_primary: values.seniority_primary.filter((s) =>
      values.seniority.includes(s),
    ),
    job_functions: values.job_functions,
    job_subfunctions: values.job_subfunctions,
  }
}

interface ICPFormProps {
  icp: Icp
  onSubmit: (payload: IcpUpdate) => void
  submitting?: boolean
  /** Submit button label (default "Save ICP"). */
  submitLabel?: string
  /** Icon shown on the submit button when not submitting (default a save icon). */
  submitIcon?: ReactNode
  /** Extra controls rendered on the left of the footer (e.g. Back / Reset). */
  leftActions?: ReactNode
  /** Confine the fields to a scrollable container so the footer stays on screen
   * (used in the wizard, where vertical space is tight). */
  scrollFields?: boolean
  /** Render every field disabled and hide the submit button (view-only). */
  readOnly?: boolean
}

/** Editable ICP form. Predefined attributes reuse the company-search UX
 * (searchable multi-selects); keywords/specialties are comma-separated text and
 * headcount is a numeric min/max. */
export function ICPForm({
  icp,
  onSubmit,
  submitting,
  submitLabel,
  submitIcon,
  leftActions,
  scrollFields,
  readOnly = false,
}: ICPFormProps) {
  const form = useForm<ICPFormValues>({
    resolver: zodResolver(icpSchema),
    defaultValues: toDefaults(icp),
  })

  // Fields are disabled while saving or when the form is view-only.
  const fieldsDisabled = submitting || readOnly

  // Primary seniority is chosen from the currently-selected seniority levels.
  const selectedSeniority = useWatch({
    control: form.control,
    name: "seniority",
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
        <div
          className={cn(
            "space-y-6",
            scrollFields &&
              "max-h-[50vh] overflow-y-auto rounded-lg border p-4",
          )}
        >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Company attributes
          </h3>
          <TextField
            control={form.control}
            name="keywords"
            label="Keywords"
            placeholder="artificial intelligence, fintech"
            description="Comma-separated keywords describing the target companies."
            disabled={fieldsDisabled}
          />
          <TextField
            control={form.control}
            name="specialties"
            label="Specialties"
            placeholder="machine learning, payments"
            description="Comma-separated specialties."
            disabled={fieldsDisabled}
          />
          <MultiComboboxField
            control={form.control}
            name="industries"
            label="Industries"
            options={INDUSTRIES}
            placeholder="Select industries…"
            searchPlaceholder="Search industries…"
            disabled={fieldsDisabled}
          />
          <MultiComboboxField
            control={form.control}
            name="company_types"
            label="Company types"
            options={COMPANY_TYPES}
            placeholder="Select company types…"
            searchPlaceholder="Search company types…"
            disabled={fieldsDisabled}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="headcount_min"
              label="Headcount (min)"
              type="number"
              placeholder="50"
              disabled={fieldsDisabled}
            />
            <TextField
              control={form.control}
              name="headcount_max"
              label="Headcount (max)"
              type="number"
              placeholder="500"
              disabled={fieldsDisabled}
            />
          </div>
          <MultiComboboxField
            control={form.control}
            name="countries"
            label="Targeted countries"
            options={COUNTRIES}
            placeholder="Select countries…"
            searchPlaceholder="Search countries…"
            disabled={fieldsDisabled}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Contact attributes
          </h3>
          <MultiComboboxField
            control={form.control}
            name="seniority"
            label="Seniority"
            options={SENIORITY}
            placeholder="Select seniority levels…"
            searchPlaceholder="Search seniority…"
            disabled={fieldsDisabled}
          />
          <div className="space-y-1.5">
            <MultiComboboxField
              control={form.control}
              name="seniority_primary"
              label="Primary seniority"
              options={selectedSeniority}
              placeholder="Mark the primary seniority levels…"
              searchPlaceholder="Search seniority…"
              disabled={fieldsDisabled || selectedSeniority.length === 0}
            />
            <p className="text-xs text-muted-foreground">
              The highest-priority subset of the seniority levels above. The rest
              are treated as acceptable (they score lower when ranking contacts).
            </p>
          </div>
          <MultiComboboxField
            control={form.control}
            name="job_functions"
            label="Job functions"
            options={JOB_FUNCTIONS}
            placeholder="Select job functions…"
            searchPlaceholder="Search functions…"
            disabled={fieldsDisabled}
          />
          <MultiComboboxField
            control={form.control}
            name="job_subfunctions"
            label="Job subfunctions"
            options={subfunctionOptions}
            placeholder="Select job subfunctions…"
            searchPlaceholder="Search subfunctions…"
            disabled={fieldsDisabled}
          />
        </section>
        </div>

        {(!readOnly || leftActions) && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">{leftActions}</div>
            {!readOnly && (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  submitIcon ?? <Save className="size-4" />
                )}
                {submitLabel ?? "Save ICP"}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}
