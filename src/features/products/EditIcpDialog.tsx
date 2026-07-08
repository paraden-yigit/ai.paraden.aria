import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ICPForm } from "@/features/products/ICPForm"
import { icpService } from "@/services/icp.service"
import { ApiError } from "@/services/http"
import type { Icp, IcpUpdate } from "@/types/icp"

interface EditIcpDialogProps {
  productId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the ICP is successfully saved (e.g. to re-run a search). */
  onSaved?: () => void
}

/**
 * Quick-edit modal for a product's ICP. Loads the ICP when opened and saves via
 * PATCH. Reuses the full ICPForm so the fields match the product page.
 */
export function EditIcpDialog({
  productId,
  open,
  onOpenChange,
  onSaved,
}: EditIcpDialogProps) {
  const [icp, setIcp] = useState<Icp | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await icpService.get(productId)
        if (active) setIcp(data)
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't load the ICP.",
        )
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [open, productId])

  async function handleSubmit(payload: IcpUpdate) {
    setSaving(true)
    try {
      await icpService.update(productId, payload)
      toast.success("ICP updated.")
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't update the ICP.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit ICP</DialogTitle>
          <DialogDescription>
            Broaden your ideal customer profile, then repopulate to find more
            companies.
          </DialogDescription>
        </DialogHeader>
        {loading || !icp ? (
          <div className="flex justify-center p-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ICPForm icp={icp} onSubmit={handleSubmit} submitting={saving} />
        )}
      </DialogContent>
    </Dialog>
  )
}
