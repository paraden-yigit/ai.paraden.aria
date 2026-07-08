import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TextField } from "@/components/form/TextField"
import type { ProductCreate } from "@/types/product"

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  onSubmit: (payload: ProductCreate) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

export function ProductForm({
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Create product",
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ name: values.name.trim() }),
        )}
        className="space-y-6"
      >
        <TextField
          control={form.control}
          name="name"
          label="Name"
          placeholder="Acme Widget"
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
