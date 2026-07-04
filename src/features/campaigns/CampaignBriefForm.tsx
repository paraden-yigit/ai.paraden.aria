import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextareaField } from "@/components/form/TextareaField"
import type { Campaign, CampaignUpdate } from "@/types/campaign"

const campaignBriefSchema = z.object({
  offering: z.string(),
  audience: z.string(),
  problem_solved: z.string(),
  buyer_challenges: z.string(),
  proof_points: z.string(),
  buyer_outcome: z.string(),
  winning_emails: z.string(),
  supporting_data: z.string(),
  email_approver: z.string(),
})

type CampaignBriefFormValues = z.infer<typeof campaignBriefSchema>

// Every brief answer is optional ("" → null on save). Name lives on the
// Campaign Info page, not here.
const BRIEF_FIELDS = [
  "offering",
  "audience",
  "problem_solved",
  "buyer_challenges",
  "proof_points",
  "buyer_outcome",
  "winning_emails",
  "supporting_data",
  "email_approver",
] as const

function toFormValues(campaign: Campaign): CampaignBriefFormValues {
  return {
    offering: campaign.offering ?? "",
    audience: campaign.audience ?? "",
    problem_solved: campaign.problem_solved ?? "",
    buyer_challenges: campaign.buyer_challenges ?? "",
    proof_points: campaign.proof_points ?? "",
    buyer_outcome: campaign.buyer_outcome ?? "",
    winning_emails: campaign.winning_emails ?? "",
    supporting_data: campaign.supporting_data ?? "",
    email_approver: campaign.email_approver ?? "",
  }
}

function toPayload(values: CampaignBriefFormValues): CampaignUpdate {
  const payload: CampaignUpdate = {}
  for (const key of BRIEF_FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface CampaignBriefFormProps {
  campaign: Campaign
  onSubmit: (payload: CampaignUpdate) => Promise<void>
  submitting?: boolean
}

export function CampaignBriefForm({
  campaign,
  onSubmit,
  submitting,
}: CampaignBriefFormProps) {
  const form = useForm<CampaignBriefFormValues>({
    resolver: zodResolver(campaignBriefSchema),
    defaultValues: toFormValues(campaign),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextareaField
          control={form.control}
          name="offering"
          label="1. What is this offering?"
          placeholder="The product or service this campaign is about."
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="audience"
          label="2. Who is it for?"
          placeholder="Target buyer — job titles, seniority, country."
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="problem_solved"
          label="3. What problem does it solve for the buyer?"
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="buyer_challenges"
          label="4. What are the biggest challenges the buyer faces?"
          placeholder="The pains and obstacles the buyer is dealing with."
          rows={4}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="proof_points"
          label="5. Key facts, stats, proof points"
          rows={4}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="buyer_outcome"
          label="6. What does the buyer get?"
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="winning_emails"
          label="7. Past emails that worked (gold standard)"
          placeholder="Paste any emails that have worked well — these become the gold-standard reference."
          rows={6}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="supporting_data"
          label="8. Supporting data"
          placeholder="Success metrics and any analytical data relevant to the product."
          rows={4}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="email_approver"
          label="9. Who signs off the email?"
          rows={2}
          disabled={submitting}
        />

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
