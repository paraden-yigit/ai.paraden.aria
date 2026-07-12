import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Building2,
  CheckCircle2,
  ListChecks,
  Loader2,
  MessageSquareText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { TextareaField } from "@/components/form/TextareaField"
import type { BrandProfile, BrandProfileUpdate } from "@/types/brand-profile"

const brandProfileSchema = z.object({
  value_proposition: z.string(),
  market_positioning: z.string(),
  competitors: z.string(),
  email_tone: z.string(),
  email_opening: z.string(),
  email_closing: z.string(),
  closing_question: z.string(),
  dos_and_donts: z.string(),
})

type BrandProfileFormValues = z.infer<typeof brandProfileSchema>
type FieldName = keyof BrandProfileFormValues

// Form keys map 1:1 to BrandProfileUpdate fields; all are optional ("" → null).
const FIELDS = [
  "value_proposition",
  "market_positioning",
  "competitors",
  "email_tone",
  "email_opening",
  "email_closing",
  "closing_question",
  "dos_and_donts",
] as const

interface FieldMeta {
  label: string
  description?: string
  placeholder?: string
  rows: number
}

const FIELD_META: Record<FieldName, FieldMeta> = {
  value_proposition: {
    label: "What does your company do?",
    description:
      "Your value proposition, in your own words. ARIA leans on this in every first email.",
    placeholder:
      "In your own words: your value proposition and what makes you unique that we need to know.",
    rows: 4,
  },
  market_positioning: {
    label: "How do you position yourself in the market? What is your USP?",
    description:
      "What makes you the right choice over the alternatives.",
    rows: 3,
  },
  competitors: {
    label: "Who are your competitors?",
    description: "A simple list of names is enough.",
    placeholder: "List your main competitors.",
    rows: 3,
  },
  email_tone: {
    label: "How should your emails sound?",
    description: "A few adjectives go a long way.",
    placeholder:
      "Describe the tone and voice, e.g. warm and conversational, but professional; avoid jargon.",
    rows: 3,
  },
  email_opening: {
    label: "How should emails open?",
    description: "The greeting ARIA starts from.",
    placeholder: "Hi John,",
    rows: 2,
  },
  email_closing: {
    label: "How should emails close?",
    description: "The sign-off on every email.",
    placeholder: "Regards, Peter",
    rows: 2,
  },
  closing_question: {
    label: "Standard closing question for every email",
    description: "The ask that ends every email.",
    placeholder: "e.g. Would you be open to a quick 15-minute call next week?",
    rows: 2,
  },
  dos_and_donts: {
    label: "Anything we should never say / always say?",
    description: "Banned phrases, must-mention points, required wording.",
    rows: 3,
  },
}

const SECTIONS: {
  title: string
  blurb: string
  icon: typeof Building2
  fields: FieldName[]
}[] = [
  {
    title: "Your company",
    blurb: "What you do and where you stand.",
    icon: Building2,
    fields: ["value_proposition", "market_positioning", "competitors"],
  },
  {
    title: "Your voice",
    blurb: "How every email should sound.",
    icon: MessageSquareText,
    fields: ["email_tone", "email_opening", "email_closing"],
  },
  {
    title: "House rules",
    blurb: "The lines every email keeps to.",
    icon: ListChecks,
    fields: ["closing_question", "dos_and_donts"],
  },
]

function toFormValues(profile: BrandProfile): BrandProfileFormValues {
  return {
    value_proposition: profile.value_proposition ?? "",
    market_positioning: profile.market_positioning ?? "",
    competitors: profile.competitors ?? "",
    email_tone: profile.email_tone ?? "",
    email_opening: profile.email_opening ?? "",
    email_closing: profile.email_closing ?? "",
    closing_question: profile.closing_question ?? "",
    dos_and_donts: profile.dos_and_donts ?? "",
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
  /** Must reject on failure so the form keeps its unsaved state. */
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
  const values = useWatch({ control: form.control })
  const { isDirty } = form.formState

  async function handleSubmit(formValues: BrandProfileFormValues) {
    try {
      await onSubmit(toPayload(formValues))
      // Saved: the current values become the new baseline.
      form.reset(formValues)
    } catch {
      // The page surfaces the error; unsaved state stays visible here.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {SECTIONS.map((section) => {
            const answered = section.fields.filter(
              (f) => (values[f] ?? "").trim() !== "",
            ).length
            const complete = answered === section.fields.length
            return (
              <Card
                key={section.title}
                className={
                  section.fields.length === 2 ? "xl:col-span-2" : undefined
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      >
                        <section.icon className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>{section.blurb}</CardDescription>
                      </div>
                    </div>
                    <span
                      className={
                        complete
                          ? "flex items-center gap-1.5 text-xs font-medium text-primary"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {complete && <CheckCircle2 className="size-3.5" />}
                      {answered} of {section.fields.length} answered
                    </span>
                  </div>
                </CardHeader>
                <CardContent
                  className={
                    section.fields.length === 2
                      ? "grid gap-6 md:grid-cols-2"
                      : "space-y-6"
                  }
                >
                  {section.fields.map((name) => (
                    <TextareaField
                      key={name}
                      control={form.control}
                      name={name}
                      label={FIELD_META[name].label}
                      description={FIELD_META[name].description}
                      placeholder={FIELD_META[name].placeholder}
                      rows={FIELD_META[name].rows}
                      disabled={submitting}
                    />
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {isDirty
              ? "You have unsaved changes."
              : "All your answers are saved."}
          </p>
          <Button type="submit" disabled={submitting || !isDirty}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
