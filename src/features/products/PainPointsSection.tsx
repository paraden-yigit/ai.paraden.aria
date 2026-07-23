import { useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { PainPointModal } from "@/features/products/wizard/PainPointModal"
import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import type { PainPointInput, ProductPainPoint } from "@/types/product"

interface PainPointsSectionProps {
  productId: number
  /** Hide the add/remove controls (non-managers). */
  readOnly?: boolean
}

/**
 * Pain points on the product detail page: the structured challenges the product
 * solves (challenge / why it matters / how it helps). Managed one at a time via
 * the shared modal; feeds the targeting profile and outreach.
 */
export function PainPointsSection({
  productId,
  readOnly = false,
}: PainPointsSectionProps) {
  const {
    data: painPoints,
    loading,
    error,
    refetch,
  } = useAsync<ProductPainPoint[]>(
    () => productService.listPainPoints(productId),
    [productId],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductPainPoint | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(pp: ProductPainPoint) {
    setEditing(pp)
    setModalOpen(true)
  }

  async function handleSave(value: PainPointInput) {
    setSaving(true)
    try {
      if (editing) {
        await productService.updatePainPoint(productId, editing.id, value)
      } else {
        await productService.addPainPoint(productId, value)
      }
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : editing
            ? "Failed to update pain point."
            : "Failed to add pain point.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(pp: ProductPainPoint) {
    setDeletingId(pp.id)
    try {
      await productService.removePainPoint(productId, pp.id)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove pain point.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pain points</CardTitle>
        <CardDescription>
          The challenges this product solves — the challenge, why it matters,
          and how the product helps. These feed the targeting profile and
          outreach.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(painPoints ?? []).length === 0}
          emptyMessage={
            readOnly
              ? "No pain points added yet."
              : "No pain points yet. Add the challenges this product solves."
          }
          onRetry={refetch}
        >
          <ul className="space-y-3">
            {(painPoints ?? []).map((pp) => (
              <li key={pp.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{pp.name}</p>
                  {!readOnly && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(pp)}
                        disabled={deletingId === pp.id}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit pain point</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(pp)}
                        disabled={deletingId === pp.id}
                      >
                        {deletingId === pp.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        <span className="sr-only">Remove pain point</span>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Challenge:
                  </span>{" "}
                  {pp.challenge}
                </p>
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Why it matters:
                  </span>{" "}
                  {pp.why_it_matters}
                </p>
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    How it helps:
                  </span>{" "}
                  {pp.how_it_helps}
                </p>
              </li>
            ))}
          </ul>
        </DataState>

        {!readOnly && (
          <div className="mt-4">
            <Button size="sm" onClick={openAdd} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add pain point
            </Button>
          </div>
        )}
      </CardContent>

      <PainPointModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={
          editing
            ? {
                name: editing.name,
                challenge: editing.challenge,
                why_it_matters: editing.why_it_matters,
                how_it_helps: editing.how_it_helps,
              }
            : null
        }
        onSave={handleSave}
      />
    </Card>
  )
}
