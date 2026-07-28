import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password."),
    new_password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(255, "Keep it under 255 characters."),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "The passwords don't match.",
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const EMPTY: ChangePasswordFormValues = {
  current_password: "",
  new_password: "",
  confirm_password: "",
}

interface ChangePasswordFormProps {
  onSubmit: (payload: {
    current_password: string
    new_password: string
  }) => Promise<void>
  submitting?: boolean
}

/** Change-password form: current password re-verified server-side. */
export function ChangePasswordForm({
  onSubmit,
  submitting,
}: ChangePasswordFormProps) {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  })

  async function handleSubmit(values: ChangePasswordFormValues) {
    await onSubmit({
      current_password: values.current_password,
      new_password: values.new_password,
    })
    form.reset(EMPTY)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <TextField
          control={form.control}
          name="current_password"
          label="Current password"
          type="password"
          disabled={submitting}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="new_password"
            label="New password"
            type="password"
            description="At least 8 characters."
            disabled={submitting}
          />
          <TextField
            control={form.control}
            name="confirm_password"
            label="Confirm new password"
            type="password"
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </div>
      </form>
    </Form>
  )
}
