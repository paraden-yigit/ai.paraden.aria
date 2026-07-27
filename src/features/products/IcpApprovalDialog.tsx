import { useCallback, useEffect, useState } from "react"
import { Check, Loader2, PencilRuler, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IcpOverview } from "@/features/products/IcpOverview"
import { ICPForm } from "@/features/products/ICPForm"
import { icpService } from "@/services/icp.service"
import { ApiError } from "@/services/http"
import type { Icp, IcpUpdate } from "@/types/icp"

const POLL_INTERVAL_MS = 2000

interface IcpApprovalDialogProps {
  productId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when the user approves the profile (dialog closes). */
  onApproved?: () => void
}

/**
 * The "Here's who we'll target" approval modal shown after the creation wizard.
 * On open it ensures the product has an ICP — generating one if needed — polls
 * while the agent runs, then shows the profile for the user to approve or edit.
 * Approving just closes the modal (the ICP is already saved on the product).
 */
export function IcpApprovalDialog({
  productId,
  open,
  onOpenChange,
  onApproved,
}: IcpApprovalDialogProps) {
  const [icp, setIcp] = useState<Icp | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<"overview" | "edit">("overview")

  const generate = useCallback(async () => {
    setStarting(true)
    try {
      setIcp(await icpService.generate(productId))
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't start ICP generation.",
      )
    } finally {
      setStarting(false)
    }
  }, [productId])

  // On open, load the ICP; if none exists yet, kick off generation.
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const existing = await icpService.get(productId)
      setIcp(existing)
      // A brand-new product from the wizard has no ICP; generate on first open.
      if (existing.status === "failed") {
        // leave it; the failed state offers a retry button
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        await generate()
      } else {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't load the profile.",
        )
      }
    } finally {
      setLoading(false)
    }
  }, [productId, generate])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("overview")
    void load()
  }, [open, load])

  // Poll while the agent generates.
  useEffect(() => {
    if (!open || icp?.status !== "generating") return
    const timer = setInterval(() => {
      icpService
        .get(productId)
        .then(setIcp)
        .catch(() => {
          /* transient — keep polling */
        })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [open, icp?.status, productId])

  async function handleSave(payload: IcpUpdate) {
    setSaving(true)
    try {
      setIcp(await icpService.update(productId, payload))
      setMode("overview")
      toast.success("Profile saved.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save the profile.",
      )
    } finally {
      setSaving(false)
    }
  }

  function approve() {
    onApproved?.()
    onOpenChange(false)
  }

  const generating = icp?.status === "generating" || starting
  const ready = icp?.status === "ready"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b p-6">
          <DialogTitle>Here's who we'll target</DialogTitle>
          <DialogDescription>
            Based on everything you shared, this is the ideal customer profile
            we'll use to find and reach prospects. Approve it to continue, or edit
            anything that's off.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading || generating ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <div>
                <p className="font-medium">Building your targeting profile…</p>
                <p className="text-sm text-muted-foreground">
                  Paraden is reading everything you shared. This usually takes a few
                  seconds.
                </p>
              </div>
            </div>
          ) : icp?.status === "failed" ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <TriangleAlert className="size-6 text-destructive" />
              <div>
                <p className="font-medium">The profile could not be written</p>
                <p className="text-sm text-muted-foreground">
                  Nothing was lost. Trying again usually resolves this.
                </p>
              </div>
              <Button onClick={generate} disabled={starting}>
                Try again
              </Button>
            </div>
          ) : ready && mode === "edit" ? (
            <ICPForm
              icp={icp}
              onSubmit={handleSave}
              submitting={saving}
              submitLabel="Save changes"
              onCancel={() => setMode("overview")}
            />
          ) : ready ? (
            <IcpOverview icp={icp} />
          ) : null}
        </div>

        {ready && mode === "overview" && (
          <DialogFooter className="border-t p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("edit")}
            >
              <PencilRuler className="size-4" />
              Edit
            </Button>
            <Button type="button" onClick={approve}>
              <Check className="size-4" />
              Approve &amp; continue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
