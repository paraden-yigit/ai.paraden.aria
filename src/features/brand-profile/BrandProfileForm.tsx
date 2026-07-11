import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextareaField } from "@/components/form/TextareaField"
import type { BrandProfile, BrandProfileUpdate } from "@/types/brand-profile"

const brandProfileSchema = z.object({
  value_proposition: z.string(),
  market_positioning: z.string(),
  competitors: z.string(),
  closing_question: z.string(),
})

type BrandProfileFormValues = z.infer<typeof brandProfileSchema>

// Form keys map 1:1 to BrandProfileUpdate fields; all are optional ("" → null).
// The email-voice questions moved to the User Profile page.
const FIELDS = [
  "value_proposition",
  "market_positioning",
  "competitors",
  "closing_question",
] as const

function toFormValues(profile: BrandProfile): BrandProfileFormValues {
  return {
    value_proposition: profile.value_proposition ?? "",
    market_positioning: profile.market_positioning ?? "",
    competitors: profile.competitors ?? "",
    closing_question: profile.closing_question ?? "",
  }
}

function toPayload(values: BrandProfileFormValues): BrandProfileUpdate {
  const payload: BrandProfileUpdate = {}
  for (const key of FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface BrandProfileFormProps {
  profile: BrandProfile
  onSubmit: (payload: BrandProfileUpdate) => Promise<void>
  submitting?: boolean
}

export function BrandProfileForm({
  profile,
  onSubmit,
  submitting,
}: BrandProfileFormProps) {
  const form = useForm<BrandProfileFormValues>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: toFormValues(profile),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <TextareaField
          control={form.control}
          name="value_proposition"
          label="What does your company do?"
          placeholder="In your own words: your value proposition and what makes you unique that we need to know."
          rows={4}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="market_positioning"
          label="How do you position yourself in the market? What is your USP?"
          rows={3}
          disabled={submitting}
        />
        <TextareaField
          control={form.control}
          name="competitors"
          label="Who are your competitors?"
          placeholder="List your main competitors."
          rows={3}
          disabled={submitting}
        />

        <TextareaField
          control={form.control}
          name="closing_question"
          label="Standard closing question for every email"
          placeholder="e.g. Would you be open to a quick 15-minute call next week?"
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
