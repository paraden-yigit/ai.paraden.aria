import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { ExcludedCompany, ExcludedCompanyCreate } from "@/types/excluded-company"

// A record needs a name plus at least one identifier (domain or LinkedIn URL);
// save is blocked when both identifiers are empty.
const excludedCompanySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    domain: z.string().max(255),
    linkedin_url: z.string().max(512),
  })
  .superRefine((values, ctx) => {
    if (!values.domain.trim() && !values.linkedin_url.trim()) {
      const message = "Enter a domain or a LinkedIn URL to save."
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["domain"], message })
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["linkedin_url"], message })
    }
  })

type ExcludedCompanyFormValues = z.infer<typeof excludedCompanySchema>

function toFormValues(company?: ExcludedCompany): ExcludedCompanyFormValues {
  return {
    name: company?.name ?? "",
    domain: company?.domain ?? "",
    linkedin_url: company?.linkedin_url ?? "",
  }
}

function nullableString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function toPayload(values: ExcludedCompanyFormValues): ExcludedCompanyCreate {
  return {
    name: values.name.trim(),
    domain: nullableString(values.domain),
    linkedin_url: nullableString(values.linkedin_url),
  }
}

interface ExcludedCompanyFormProps {
  /** Existing record when editing; omit for create. */
  company?: ExcludedCompany
  onSubmit: (payload: ExcludedCompanyCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function ExcludedCompanyForm({
  company,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save changes",
}: ExcludedCompanyFormProps) {
  const form = useForm<ExcludedCompanyFormValues>({
    resolver: zodResolver(excludedCompanySchema),
    defaultValues: toFormValues(company),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextField
          control={form.control}
          name="name"
          label="Company name"
          placeholder="Acme Inc."
          disabled={submitting}
        />
        <TextField
          control={form.control}
          name="domain"
          label="Domain"
          placeholder="acme.com"
          description="Provide a domain or a LinkedIn URL (at least one is required)."
          disabled={submitting}
        />
        <TextField
          control={form.control}
          name="linkedin_url"
          label="LinkedIn URL"
          placeholder="https://www.linkedin.com/company/acme"
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
