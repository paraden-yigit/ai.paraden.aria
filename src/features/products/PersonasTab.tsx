import { useState } from "react"
import { Loader2, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"
import {
  PERSONA_MAX,
  PERSONA_MIN,
  type ProductPersona,
} from "@/types/product"

interface PersonasTabProps {
  productId: number
  /** Hide the add/remove controls and show the list read-only (non-managers). */
  readOnly?: boolean
}

/**
 * Personas tab for a product: the exact job titles/roles the client wants to
 * reach. Unlike the ICP's FullEnrich-derived attributes, these are free-text
 * and more specific (e.g. "Regional Marketing Director"), and are meant to take
 * priority when picking a company's contacts. Managed one at a time; a product
 * keeps between 2 and 5.
 */
export function PersonasTab({ productId, readOnly = false }: PersonasTabProps) {
  const {
    data: personas,
    loading,
    error,
    refetch,
  } = useAsync<ProductPersona[]>(
    () => productService.listPersonas(productId),
    [productId],
  )

  const [title, setTitle] = useState("")
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const count = personas?.length ?? 0
  const atMax = count >= PERSONA_MAX
  const belowMin = count < PERSONA_MIN

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || adding || atMax) return
    setAdding(true)
    try {
      await productService.addPersona(productId, trimmed)
      setTitle("")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add persona.",
      )
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(persona: ProductPersona) {
    setDeletingId(persona.id)
    try {
      await productService.removePersona(productId, persona.id)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove persona.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Personas</h2>
        <p className="text-muted-foreground">
          The exact job titles or roles you want to reach (e.g. "Regional
          Marketing Director"). These take priority over generic matches when
          picking a company's contacts. Add between {PERSONA_MIN} and{" "}
          {PERSONA_MAX}.
        </p>
      </div>

      {!readOnly && (
        <form onSubmit={handleAdd} className="flex items-start gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Regional Marketing Director"
            maxLength={255}
            disabled={adding || atMax}
            aria-label="Persona job title"
          />
          <Button type="submit" disabled={adding || atMax || !title.trim()}>
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </form>
      )}

      {!readOnly && atMax && (
        <p className="text-sm text-muted-foreground">
          You've reached the maximum of {PERSONA_MAX} personas. Remove one to add
          another.
        </p>
      )}

      <DataState
        loading={loading}
        error={error}
        isEmpty={count === 0}
        emptyMessage={
          readOnly
            ? "No personas added yet."
            : "No personas yet. Add the exact job titles you want to target."
        }
        onRetry={refetch}
      >
        <div className="space-y-3">
          {!readOnly && belowMin && count > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Add at least {PERSONA_MIN} personas ({count} of {PERSONA_MIN}).
            </p>
          )}
          <ul className="divide-y rounded-md border">
            {(personas ?? []).map((persona) => (
              <li
                key={persona.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <UserRound className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {persona.title}
                </span>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(persona)}
                    disabled={deletingId === persona.id}
                  >
                    {deletingId === persona.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    <span className="sr-only">Remove persona</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DataState>
    </div>
  )
}
