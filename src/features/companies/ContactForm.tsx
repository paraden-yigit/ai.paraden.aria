import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { Contact, ContactCreate } from "@/types/contact"

const contactSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  job_title: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  seniority: z.string(),
  department: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin_url: z.string(),
  city: z.string(),
  region: z.string(),
  country: z.string(),
})

type ContactFormValues = z.infer<typeof contactSchema>

const OPTIONAL_FIELDS = [
  "job_title",
  "first_name",
  "last_name",
  "seniority",
  "department",
  "email",
  "phone",
  "linkedin_url",
  "city",
  "region",
  "country",
] as const

function toFormValues(contact?: Contact): ContactFormValues {
  return {
    full_name: contact?.full_name ?? "",
    job_title: contact?.job_title ?? "",
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    seniority: contact?.seniority ?? "",
    department: contact?.department ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    linkedin_url: contact?.linkedin_url ?? "",
    city: contact?.city ?? "",
    region: contact?.region ?? "",
    country: contact?.country ?? "",
  }
}

function toPayload(values: ContactFormValues): ContactCreate {
  const payload: ContactCreate = { full_name: values.full_name.trim() }
  for (const key of OPTIONAL_FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface ContactFormProps {
  /** Existing contact when editing; omit for create. */
  contact?: Contact
  onSubmit: (payload: ContactCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function ContactForm({
  contact,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save changes",
}: ContactFormProps) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: toFormValues(contact),
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
            name="full_name"
            label="Full name"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="job_title"
            label="Job title"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="first_name"
            label="First name"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="last_name"
            label="Last name"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="seniority"
            label="Seniority"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="department"
            label="Department"
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
            name="linkedin_url"
            label="LinkedIn URL"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="city"
            label="City"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="region"
            label="Region"
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="country"
            label="Country"
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
            {submitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
