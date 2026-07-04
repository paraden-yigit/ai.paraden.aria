import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { Campaign, CampaignCreate } from "@/types/campaign"

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

type CampaignFormValues = z.infer<typeof campaignSchema>

function toFormValues(campaign?: Campaign): CampaignFormValues {
  return { name: campaign?.name ?? "" }
}

function toPayload(values: CampaignFormValues): CampaignCreate {
  return { name: values.name.trim() }
}

interface CampaignFormProps {
  /** Existing campaign when editing; omit for create. */
  campaign?: Campaign
  onSubmit: (payload: CampaignCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function CampaignForm({
  campaign,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save changes",
}: CampaignFormProps) {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: toFormValues(campaign),
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
          placeholder="Spring outreach"
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
