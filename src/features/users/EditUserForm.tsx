import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { SelectField, type SelectOption } from "@/components/form/SelectField"
import { USER_ROLES, roleLabel } from "@/lib/roles"
import type { Team } from "@/types/team"
import type { ClientUser, UserManageUpdate } from "@/types/user"

// Sentinel for "no team" — shadcn Select can't hold an empty string value.
const NO_TEAM = "none"

const schema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  role: z.enum(USER_ROLES),
  team_id: z.string(),
})

type EditUserFormValues = z.infer<typeof schema>

function toFormValues(user: ClientUser): EditUserFormValues {
  return {
    full_name: user.full_name,
    role: user.role as (typeof USER_ROLES)[number],
    // The modal models one team per user; show the first if they're on several.
    team_id: user.teams[0] ? String(user.teams[0].id) : NO_TEAM,
  }
}

function toPayload(values: EditUserFormValues): UserManageUpdate {
  return {
    full_name: values.full_name.trim(),
    role: values.role,
    team_id: values.team_id === NO_TEAM ? null : Number(values.team_id),
  }
}

const roleOptions: SelectOption[] = USER_ROLES.map((role) => ({
  value: role,
  label: roleLabel(role),
}))

interface EditUserFormProps {
  user: ClientUser
  teams: Team[]
  onSubmit: (payload: UserManageUpdate) => Promise<void>
  onCancel?: () => void
  /** When provided, renders a destructive "Delete user" button (managers only). */
  onDelete?: () => void
  submitting?: boolean
}

export function EditUserForm({
  user,
  teams,
  onSubmit,
  onCancel,
  onDelete,
  submitting,
}: EditUserFormProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(user),
  })

  const teamOptions: SelectOption[] = [
    { value: NO_TEAM, label: "No team" },
    ...teams.map((team) => ({ value: String(team.id), label: team.name })),
  ]

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextField
          control={form.control}
          name="full_name"
          label="Name"
          disabled={submitting}
        />
        <SelectField
          control={form.control}
          name="team_id"
          label="Team"
          options={teamOptions}
          disabled={submitting}
        />
        <SelectField
          control={form.control}
          name="role"
          label="Role"
          options={roleOptions}
          disabled={submitting}
        />

        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={submitting}
            >
              <Trash2 className="size-4" />
              Delete user
            </Button>
          ) : (
            <span />
          )}
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
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
