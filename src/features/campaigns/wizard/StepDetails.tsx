import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TextField } from "@/components/form/TextField"
import { SelectField } from "@/components/form/SelectField"
import { useProductOptions } from "@/hooks/useProductOptions"
import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import type { Campaign } from "@/types/campaign"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  product_id: z.string().min(1, "Product is required"),
  // The user targets either companies or contacts — one or the other.
  target_type: z.enum(["companies", "contacts"]),
  target_count: z
    .string()
    .min(1, "This is required")
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) >= 1,
      "Enter a whole number of at least 1",
    ),
})

type Values = z.infer<typeof schema>

const TARGET_TYPE_OPTIONS = [
  { value: "companies", label: "Companies" },
  { value: "contacts", label: "Contacts" },
]

interface StepDetailsProps {
  /** The already-created campaign when returning to this step; undefined on first entry. */
  campaign: Campaign | null
  /** Called with the created/updated campaign to advance the wizard. */
  onSaved: (campaign: Campaign) => void
}

/**
 * Step 1 — campaign name + product. Completing this step creates the campaign
 * (or updates it if the user came back). The next step clones the selected
 * product's ICP onto the campaign for final edits, so nothing ICP-related is
 * configured here.
 */
export function StepDetails({ campaign, onSaved }: StepDetailsProps) {
  const { options: productOptions, loading: productsLoading } = useProductOptions()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: campaign?.name ?? "",
      product_id:
        campaign?.product_id != null ? String(campaign.product_id) : "",
      target_type: campaign?.target_type ?? "companies",
      target_count:
        campaign?.target_count != null ? String(campaign.target_count) : "50",
    },
  })

  async function onSubmit(values: Values) {
    const payload = {
      name: values.name.trim(),
      product_id: Number(values.product_id),
      target_type: values.target_type,
      target_count: Number(values.target_count),
    }
    setSubmitting(true)
    try {
      const saved = campaign
        ? await campaignService.update(campaign.id, payload)
        : await campaignService.create(payload)
      onSaved(saved)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save the campaign.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TextField
          control={form.control}
          name="name"
          label="Campaign name"
          placeholder="Spring outreach"
          disabled={submitting}
        />

        <SelectField
          control={form.control}
          name="product_id"
          label="Product"
          options={productOptions}
          placeholder={
            productsLoading
              ? "Loading products…"
              : productOptions.length === 0
                ? "No products yet. Create one first"
                : "Select a product"
          }
          disabled={submitting || productsLoading || productOptions.length === 0}
        />
        <p className="text-sm text-muted-foreground">
          You&apos;ll review and edit a copy of this product&apos;s ideal
          customer profile in the next step.
        </p>

        <div className="space-y-2">
          <span className="text-sm font-medium leading-none">
            What is your target?
          </span>
          <div className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="target_count"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="50"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_type"
              render={({ field }) => (
                <FormItem className="w-40">
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TARGET_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {campaign ? "Save & continue" : "Create & continue"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
