import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { Client, ClientUpdate } from "@/types/client"

const companySchema = z.object({
  legal_business_name: z.string(),
  address: z.string(),
  country: z.string(),
  email: z
    .string()
    .refine((v) => v.trim() === "" || z.string().email().safeParse(v.trim()).success, {
      message: "Enter a valid email",
    }),
  phone: z.string(),
  url: z.string().max(512),
  company_registration_number: z.string(),
  vat_registration_number: z.string(),
})

type CompanyProfileFormValues = z.infer<typeof companySchema>

// Form keys map 1:1 to ClientUpdate fields; all are optional ("" → null).
const FIELDS = [
  "legal_business_name",
  "address",
  "country",
  "email",
  "phone",
  "url",
  "company_registration_number",
  "vat_registration_number",
] as const

function toFormValues(client: Client): CompanyProfileFormValues {
  return {
    legal_business_name: client.legal_business_name ?? "",
    address: client.address ?? "",
    country: client.country ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    url: client.url ?? "",
    company_registration_number: client.company_registration_number ?? "",
    vat_registration_number: client.vat_registration_number ?? "",
  }
}

function toPayload(values: CompanyProfileFormValues): ClientUpdate {
  const payload: ClientUpdate = {}
  for (const key of FIELDS) {
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
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="legal_business_name"
            label="Legal name"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="country"
            label="Country"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="url"
            label="URL"
            type="url"
            placeholder="https://example.com"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="company_registration_number"
            label="Company reg. number"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="vat_registration_number"
            label="VAT reg. number"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="address"
            label="Address"
            disabled={submitting}
          />
        </div>

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
