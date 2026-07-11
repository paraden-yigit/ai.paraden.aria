import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { roleLabel } from "@/lib/roles"
import type { User, UserProfileUpdate } from "@/types/auth"

const userProfileSchema = z.object({
  full_name: z.string().min(1, "Your name is required."),
})

type UserProfileFormValues = z.infer<typeof userProfileSchema>

function toFormValues(user: User): UserProfileFormValues {
  return { full_name: user.full_name }
}

function toPayload(values: UserProfileFormValues): UserProfileUpdate {
  return { full_name: values.full_name.trim() }
}

interface UserProfileFormProps {
  user: User
  onSubmit: (payload: UserProfileUpdate) => Promise<void>
  submitting?: boolean
}

export function UserProfileForm({
  user,
  onSubmit,
  submitting,
}: UserProfileFormProps) {
  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: toFormValues(user),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextField
          control={form.control}
          name="full_name"
          label="Your name"
          disabled={submitting}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">Role</p>
            <p className="text-sm text-muted-foreground">{roleLabel(user.role)}</p>
          </div>
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
