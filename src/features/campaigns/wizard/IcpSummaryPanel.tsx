import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { composeIcpSummary } from "@/features/products/icpSummary"
import { icpService } from "@/services/icp.service"
import type { Icp } from "@/types/icp"

/**
 * Sidebar for the discovery step: the product's targeting profile in plain
 * English, so the user can judge the search results against who they asked
 * for, and jump into editing when the match feels off. Renders nothing when
 * the profile is missing (the step's own guards handle that case).
 */
export function IcpSummaryPanel({
  productId,
  onEdit,
  disabled,
  refreshKey = 0,
}: {
  productId: number | null
  onEdit?: () => void
  disabled?: boolean
  /** Bump to re-fetch after the ICP was edited in the dialog. */
  refreshKey?: number
}) {
  const [icp, setIcp] = useState<Icp | null>(null)

  useEffect(() => {
    if (productId == null) return
    let active = true
    icpService
      .get(productId)
      .then((res) => active && setIcp(res.status === "ready" ? res : null))
      .catch(() => active && setIcp(null))
    return () => {
      active = false
    }
  }, [productId, refreshKey])

  if (!icp) return null

  return (
    <aside className="h-fit rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-semibold">Who we search for</p>
      <div className="mt-2 space-y-1">
        {composeIcpSummary(icp).map((s) => (
          <p key={s} className="text-sm leading-relaxed text-muted-foreground">
            {s}
          </p>
        ))}
      </div>
      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onEdit}
          disabled={disabled}
        >
          <Pencil className="size-4" />
          Edit targeting
        </Button>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Results are staged for your approval. Nothing is saved to the campaign
        until you approve it.
      </p>
    </aside>
  )
}
