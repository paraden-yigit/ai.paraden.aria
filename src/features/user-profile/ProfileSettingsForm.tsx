import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { TextareaField } from "@/components/form/TextareaField"
import { ProfilePictureField } from "@/features/user-profile/ProfilePictureField"
import type { User, UserProfileUpdate } from "@/types/auth"

const profileSettingsSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email_closing: z.string().max(255, "Keep the closing to a single line."),
  email_signature: z.string(),
})

type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>

// Each field maps 1:1 to a UserProfileUpdate key; all optional ("" → null).
const FIELDS = [
  "first_name",
  "last_name",
  "email_closing",
  "email_signature",
] as const

/** What an email closes with when nobody has chosen anything else. The API
 * resolves the same default when the field is empty, so the line shown here is
 * the line that actually goes out — saving it changes nothing but makes it the
 * user's own. */
function defaultClosing(user: User): string {
  const name = (user.first_name ?? "").trim() || (user.last_name ?? "").trim()
  return name ? `Regards, ${name}` : ""
}

function toFormValues(user: User): ProfileSettingsFormValues {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    // Both are per workspace: the signature carries a company name, and the
    // closing is how this person signs off for this company.
    email_closing: user.active_workspace?.email_closing ?? defaultClosing(user),
    email_signature: user.active_workspace?.email_signature ?? "",
  }
}

function toPayload(values: ProfileSettingsFormValues): UserProfileUpdate {
  const payload: UserProfileUpdate = {}
  for (const key of FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface ProfileSettingsFormProps {
  user: User
  onSubmit: (payload: UserProfileUpdate) => Promise<void>
  /** Refresh the cached user after the avatar (a separate upload) changes. */
  onAvatarUploaded: () => void | Promise<void>
  submitting?: boolean
}

export function ProfileSettingsForm({
  user,
  onSubmit,
  onAvatarUploaded,
  submitting,
}: ProfileSettingsFormProps) {
  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
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
        <Card>
          <CardContent className="space-y-6 pt-6">
            <ProfilePictureField
              user={user}
              onUploaded={onAvatarUploaded}
              disabled={submitting}
            />

            {/* Everything typed sits in the left column, one field under the
              * next, with only the signature's preview on the right — the fields
              * read as one column to fill in rather than a form that zig-zags. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
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
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  {/* A textarea, not an input: "Regards," and a name underneath
                    * is how most people sign a letter, and the line breaks are
                    * kept exactly as they are typed. */}
                  <TextareaField
                    control={form.control}
                    name="email_closing"
                    label="How should your emails close"
                    description="The last thing said before your signature. Write it over as many lines as you like."
                    placeholder={defaultClosing(user) || "Regards,\nJane"}
                    rows={3}
                    disabled={submitting}
                  />
                  <TextareaField
                    control={form.control}
                    name="email_signature"
                    label="Email signature"
                    placeholder={
                      '<p>Best regards,<br />Jane Doe<br /><a href="https://example.com">example.com</a></p>'
                    }
                    rows={6}
                    disabled={submitting}
                  />
                </div>
                {/* Pinned to the bottom of the row so it sits beside the
                  * signature it previews rather than beside the closing. */}
                <div className="space-y-2 sm:self-end">
                  <p className="text-sm font-medium leading-none">Preview</p>
                  {signature.trim() !== "" ? (
                    <div
                      className="min-h-[8.5rem] rounded-md border bg-muted/40 p-4 text-sm"
                      // The signature is the user's own HTML, rendered back to
                      // them only as a preview of what will be appended to their
                      // emails.
                      dangerouslySetInnerHTML={{ __html: signature }}
                    />
                  ) : (
                    <div className="flex min-h-[8.5rem] items-center justify-center rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                      Your signature preview will appear here.
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This goes at the end of every email Paraden writes for your
                campaigns. HTML works here, so links and simple formatting are
                fine; start from the example shown and check the live preview
                alongside it.
              </p>
            </div>
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
