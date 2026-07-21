import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { TextareaField } from "@/components/form/TextareaField"
import { ComboboxField } from "@/components/form/ComboboxField"
import { INDUSTRIES } from "@/features/companies/industries"
import type { Client, ClientUpdate } from "@/types/client"

const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  city: z.string().max(255),
  country: z.string().max(255),
  url: z.string().max(512),
  industry: z.string().max(255),
  linkedin_url: z.string().max(512),
  value_proposition: z.string(),
})

type CompanyProfileFormValues = z.infer<typeof companySchema>

// Optional form keys map 1:1 to ClientUpdate fields; all are optional ("" → null).
const OPTIONAL_FIELDS = [
  "city",
  "country",
  "url",
  "industry",
  "linkedin_url",
  "value_proposition",
] as const

function toFormValues(client: Client): CompanyProfileFormValues {
  return {
    name: client.name ?? "",
    city: client.city ?? "",
    country: client.country ?? "",
    url: client.url ?? "",
    industry: client.industry ?? "",
    linkedin_url: client.linkedin_url ?? "",
    value_proposition: client.value_proposition ?? "",
  }
}

function toPayload(values: CompanyProfileFormValues): ClientUpdate {
  const payload: ClientUpdate = { name: values.name.trim() }
  for (const key of OPTIONAL_FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface CompanyProfileFormProps {
  client: Client
  onSubmit: (payload: ClientUpdate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
}

export function CompanyProfileForm({
  client,
  onSubmit,
  onCancel,
  submitting,
}: CompanyProfileFormProps) {
  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toFormValues(client),
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
          disabled={submitting}
        />
        <ComboboxField
          control={form.control}
          name="industry"
          label="Industry"
          options={INDUSTRIES}
          disabled={submitting}
        />
        <TextField
          control={form.control}
          name="url"
          label="Website URL"
          type="url"
          placeholder="https://example.com"
          disabled={submitting}
        />
        <TextField
          control={form.control}
          name="linkedin_url"
          label="LinkedIn URL"
          placeholder="https://www.linkedin.com/company/…"
          disabled={submitting}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="city"
            label="City"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="country"
            label="Country"
            disabled={submitting}
          />
        </div>
        <TextareaField
          control={form.control}
          name="value_proposition"
          label="What does your company do?"
          placeholder="In your own words: your value proposition and what makes you unique that we need to know."
          rows={4}
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
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
