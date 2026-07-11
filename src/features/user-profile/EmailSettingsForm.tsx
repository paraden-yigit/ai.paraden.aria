import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextareaField } from "@/components/form/TextareaField"
import type { User, UserProfileUpdate } from "@/types/auth"

const emailSettingsSchema = z.object({
  email_tone: z.string(),
  email_opening: z.string(),
  email_closing: z.string(),
  dos_and_donts: z.string(),
  email_signature: z.string(),
})

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>

// Each field maps 1:1 to a UserProfileUpdate key; all optional ("" → null).
const FIELDS = [
  "email_tone",
  "email_opening",
  "email_closing",
  "dos_and_donts",
  "email_signature",
] as const

function toFormValues(user: User): EmailSettingsFormValues {
  return {
    email_tone: user.email_tone ?? "",
    email_opening: user.email_opening ?? "",
    email_closing: user.email_closing ?? "",
    dos_and_donts: user.dos_and_donts ?? "",
    email_signature: user.email_signature ?? "",
  }
}

function toPayload(values: EmailSettingsFormValues): UserProfileUpdate {
  const payload: UserProfileUpdate = {}
  for (const key of FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface EmailSettingsFormProps {
  user: User
  onSubmit: (payload: UserProfileUpdate) => Promise<void>
  submitting?: boolean
}

export function EmailSettingsForm({
  user,
  onSubmit,
  submitting,
}: EmailSettingsFormProps) {
  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: toFormValues(user),
  })

  const signature = useWatch({
    control: form.control,
    name: "email_signature",
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextareaField
          control={form.control}
          name="email_tone"
          label="How should your emails sound?"
          placeholder="Describe the tone and voice, e.g. warm and conversational, but professional; avoid jargon."
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="email_opening"
          label="How should emails open?"
          placeholder="Hi John,"
          rows={2}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="email_closing"
          label="How should emails close?"
          placeholder="Regards, Peter"
          rows={2}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="dos_and_donts"
          label="Anything we should never say / always say?"
          rows={3}
          disabled={submitting}
        />

        <div className="space-y-2">
          <TextareaField
            control={form.control}
            name="email_signature"
            label="Email signature (HTML)"
            placeholder={
              '<p>Best regards,<br />Jane Doe<br /><a href="https://example.com">example.com</a></p>'
            }
            rows={6}
            disabled={submitting}
          />
          <p className="text-sm text-muted-foreground">
            Paste raw HTML. This is appended to the end of every email generated
            from campaigns you create.
          </p>
          {signature.trim() !== "" && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <div
                className="rounded-md border bg-muted/40 p-4 text-sm"
                // The signature is the user's own HTML, rendered back to them
                // only as a preview of what will be appended to their emails.
                dangerouslySetInnerHTML={{ __html: signature }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
