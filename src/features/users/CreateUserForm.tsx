import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import { SelectField, type SelectOption } from "@/components/form/SelectField"
import { USER_ROLES, roleLabel } from "@/lib/roles"
import type { Team } from "@/types/team"
import type { UserManageCreate } from "@/types/user"

// Sentinel for "no team" — shadcn Select can't hold an empty string value.
const NO_TEAM = "none"

const schema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(USER_ROLES),
  team_id: z.string(),
})

type CreateUserFormValues = z.infer<typeof schema>

function toPayload(values: CreateUserFormValues): UserManageCreate {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    role: values.role,
    team_id: values.team_id === NO_TEAM ? null : Number(values.team_id),
  }
}

const roleOptions: SelectOption[] = USER_ROLES.map((role) => ({
  value: role,
  label: roleLabel(role),
}))

interface CreateUserFormProps {
  teams: Team[]
  onSubmit: (payload: UserManageCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
}

export function CreateUserForm({
  teams,
  onSubmit,
  onCancel,
  submitting,
}: CreateUserFormProps) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "user",
      team_id: NO_TEAM,
    },
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
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
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
            Create user
          </Button>
        </div>
      </form>
    </Form>
  )
}
