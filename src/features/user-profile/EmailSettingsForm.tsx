import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TextField } from "@/components/form/TextField"
import { useAsync } from "@/hooks/useAsync"
import { emailToneTemplateService } from "@/services/emailToneTemplate.service"
import type { User, UserProfileUpdate } from "@/types/auth"

function isEmail(value: string): boolean {
  return z.string().email().safeParse(value).success
}

const emailSettingsSchema = z.object({
  email_tone: z.string(),
  forwarding_email: z
    .string()
    .refine((v) => v.trim() === "" || isEmail(v.trim()), {
      message: "Enter a valid email address.",
    }),
})

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>

// Each field maps 1:1 to a UserProfileUpdate key; all optional ("" → null).
const FIELDS = ["email_tone", "forwarding_email"] as const

function toFormValues(user: User): EmailSettingsFormValues {
  return {
    email_tone: user.email_tone ?? "",
    forwarding_email: user.forwarding_email ?? "",
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

  // Admin-curated tone templates. Selecting one replaces the email_tone field
  // with the template's instruction. The Select is kept controlled to "" so it
  // acts as a repeatable action picker (always shows the placeholder).
  const { data: templates } = useAsync(
    () => emailToneTemplateService.list(),
    [],
  )

  function applyTemplate(templateId: string) {
    const template = templates?.find((t) => String(t.id) === templateId)
    if (!template) return
    form.setValue("email_tone", template.instruction, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        {/* Section 1 — Writing style */}
        <Card>
          <CardHeader>
            <CardTitle>Writing style</CardTitle>
            <CardDescription>How should your emails sound?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="email_tone"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormLabel>How should your emails sound?</FormLabel>
                    {templates && templates.length > 0 && (
                      <Select value="" onValueChange={applyTemplate}>
                        <SelectTrigger
                          className="w-56"
                          disabled={submitting}
                          aria-label="Start from a tone template"
                        >
                          <SelectValue placeholder="Start from a template…" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem
                              key={template.id}
                              value={String(template.id)}
                            >
                              {template.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the tone and voice, e.g. warm and conversational, but professional; avoid jargon."
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2 — Forwarding */}
        <Card>
          <CardHeader>
            <CardTitle>Forwarding</CardTitle>
            <CardDescription>
              Where replies and notifications for your outreach should be
              forwarded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextField
              control={form.control}
              name="forwarding_email"
              label="Forwarding email address"
              type="email"
              placeholder="you@company.com"
              disabled={submitting}
            />
          </CardContent>
        </Card>

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
