import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Product, ProductUpdate } from "@/types/product"

// The product name plus the brief answers, in display order. `name` is a
// single-line required field; the rest are optional free-text areas.
type FieldKey = keyof Pick<
  Product,
  | "name"
  | "offering"
  | "audience"
  | "problem_solved"
  | "buyer_challenges"
  | "proof_points"
  | "buyer_outcome"
>

interface FieldConfig {
  key: FieldKey
  label: string
  multiline: boolean
  rows?: number
  placeholder?: string
  required?: boolean
}

const FIELDS: FieldConfig[] = [
  { key: "name", label: "Product name", multiline: false, placeholder: "Acme Widget", required: true },
  { key: "offering", label: "1. What is this offering?", multiline: true, rows: 3, placeholder: "The product or service this is about." },
  { key: "audience", label: "2. Who is it for?", multiline: true, rows: 3, placeholder: "Target buyer: job titles, seniority, country." },
  { key: "problem_solved", label: "3. What problem does it solve for the buyer?", multiline: true, rows: 3 },
  { key: "buyer_challenges", label: "4. What are the biggest challenges the buyer faces?", multiline: true, rows: 4, placeholder: "The pains and obstacles the buyer is dealing with." },
  { key: "proof_points", label: "5. Key facts, stats, proof points", multiline: true, rows: 4 },
  { key: "buyer_outcome", label: "6. What does the buyer get?", multiline: true, rows: 3 },
]

interface ProductInfoViewProps {
  product: Product
  /** Persist a single-field change. Should reject if the save fails. */
  onSave: (payload: ProductUpdate) => Promise<void>
  /** Hide the Edit affordances and show values only (non-owners). */
  readOnly?: boolean
}

/**
 * Read-only view of the product info, with an Edit button beside each item.
 * Editing one item swaps it for an inline editor (Save / Cancel); saving one
 * field at a time via a partial update. When ``readOnly`` the Edit buttons are
 * hidden and only the values are shown.
 */
export function ProductInfoView({
  product,
  onSave,
  readOnly = false,
}: ProductInfoViewProps) {
  const [editingKey, setEditingKey] = useState<FieldKey | null>(null)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit(field: FieldConfig) {
    setEditingKey(field.key)
    setDraft(product[field.key] ?? "")
    setError(null)
  }

  function cancelEdit() {
    setEditingKey(null)
    setError(null)
  }

  async function saveEdit(field: FieldConfig) {
    const trimmed = draft.trim()
    if (field.required && trimmed === "") {
      setError(`${field.label} is required.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Required fields keep an empty guard above; optional ones store "" as null.
      await onSave({ [field.key]: trimmed === "" ? null : trimmed })
      setEditingKey(null)
    } catch {
      // The page surfaces the error toast; keep the editor open to retry.
    } finally {
      setSaving(false)
    }
  }

  return (
    <dl className="divide-y">
      {FIELDS.map((field) => {
        const editing = editingKey === field.key
        const value = product[field.key]
        return (
          <div key={field.key} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </dt>
              {!editing && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-my-1 h-7 shrink-0 text-muted-foreground"
                  onClick={() => startEdit(field)}
                  disabled={saving}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <div className="mt-2 space-y-2">
                {field.multiline ? (
                  <Textarea
                    autoFocus
                    rows={field.rows ?? 3}
                    placeholder={field.placeholder}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <Input
                    autoFocus
                    placeholder={field.placeholder}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={saving}
                  />
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveEdit(field)}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <dd className="mt-1 text-sm whitespace-pre-wrap">
                {value || (
                  <span className="text-muted-foreground">Not answered yet</span>
                )}
              </dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}
