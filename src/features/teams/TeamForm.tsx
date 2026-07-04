import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { Team, TeamCreate } from "@/types/team"

const teamSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

type TeamFormValues = z.infer<typeof teamSchema>

function toFormValues(team?: Team): TeamFormValues {
  return { name: team?.name ?? "" }
}

function toPayload(values: TeamFormValues): TeamCreate {
  return { name: values.name.trim() }
}

interface TeamFormProps {
  /** Existing team when editing; omit for create. */
  team?: Team
  onSubmit: (payload: TeamCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function TeamForm({
  team,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save changes",
}: TeamFormProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: toFormValues(team),
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
          label="Name"
          placeholder="Sales"
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
