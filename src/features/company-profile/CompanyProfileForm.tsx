import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextField } from "@/components/form/TextField"
import { TextareaField } from "@/components/form/TextareaField"
import type { Client, ClientUpdate } from "@/types/client"

const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  country: z.string(),
  url: z.string().max(512),
  value_proposition: z.string(),
  market_positioning: z.string(),
  competitors: z.string(),
})

type CompanyProfileFormValues = z.infer<typeof companySchema>

// Optional form keys map 1:1 to ClientUpdate fields; all are optional ("" → null).
const OPTIONAL_FIELDS = [
  "country",
  "url",
  "value_proposition",
  "market_positioning",
  "competitors",
] as const

function toFormValues(client: Client): CompanyProfileFormValues {
  return {
    name: client.name ?? "",
    country: client.country ?? "",
    url: client.url ?? "",
    value_proposition: client.value_proposition ?? "",
    market_positioning: client.market_positioning ?? "",
    competitors: client.competitors ?? "",
  }
}

function toPayload(values: CompanyProfileFormValues): ClientUpdate {
  const payload: ClientUpdate = { name: values.name.trim() }
  for (const key of OPTIONAL_FIELDS) {
    const trimmed = values[key].trim()
    payload[key] = trimmed === "" ? null : trimmed
  }
  return payload
}

interface CompanyProfileFormProps {
  client: Client
  onSubmit: (payload: ClientUpdate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
}

export function CompanyProfileForm({
  client,
  onSubmit,
  onCancel,
  submitting,
}: CompanyProfileFormProps) {
  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toFormValues(client),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(toPayload(values)))}
        className="space-y-6"
      >
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Company details</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="name"
                label="Name"
                disabled={submitting}
              />
              <TextField
                control={form.control}
                name="country"
                label="Country"
                disabled={submitting}
              />
              <TextField
                control={form.control}
                name="url"
                label="URL"
                type="url"
                placeholder="https://example.com"
                disabled={submitting}
              />
            </div>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-4">
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
          </TabsContent>
        </Tabs>

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
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
