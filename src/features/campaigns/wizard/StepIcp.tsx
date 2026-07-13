import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ICPForm } from "@/features/products/ICPForm"
import { campaignIcpService, icpService } from "@/services/icp.service"
import { ApiError } from "@/services/http"
import type { Icp, IcpUpdate } from "@/types/icp"

const POLL_INTERVAL_MS = 2000

interface StepIcpProps {
  campaignId: number
  /** The campaign's product — its ICP is the template we clone from. */
  productId: number | null
  /** Advance the wizard once the ICP is approved. */
  onApprove: () => void
  onBack: () => void
}

/**
 * Step "Ideal customers" — the campaign gets its own copy of the product's ICP
 * so the user can make final edits and approve it without touching the reusable
 * product template. Discovery then finds contacts from this campaign copy.
 *
 * On entry we clone the product's ICP into the campaign (idempotent, so re-entry
 * keeps prior edits). If the product has no ready ICP yet, we offer to generate
 * it first (reusing the product ICP flow), then clone.
 */
export function StepIcp({ campaignId, productId, onApprove, onBack }: StepIcpProps) {
  const [icp, setIcp] = useState<Icp | null>(null)
  const [loading, setLoading] = useState(true)
  // Set when the product's ICP isn't ready to clone from; carries its status so
  // we can show a "generating" spinner or a "generate" prompt.
  const [productIcp, setProductIcp] = useState<Icp | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  // Bumped after a reset to remount ICPForm with the fresh default values.
  const [formKey, setFormKey] = useState(0)

  // Try to clone the product's ICP into the campaign. On a 409 the product ICP
  // isn't ready, so fall back to showing its status (generate / generating).
  const ensure = useCallback(async () => {
    setLoading(true)
    setBlocked(false)
    try {
      const cloned = await campaignIcpService.clone(campaignId)
      setIcp(cloned)
      setProductIcp(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Product ICP missing or still generating — surface its state.
        if (productId != null) {
          try {
            setProductIcp(await icpService.get(productId))
          } catch (inner) {
            // 404 → never generated; anything else → treat as no ICP yet.
            if (inner instanceof ApiError && inner.status === 404) setProductIcp(null)
          }
        }
        setBlocked(true)
      } else {
        toast.error(err instanceof ApiError ? err.message : "Couldn't prepare the ICP.")
        setBlocked(true)
      }
    } finally {
      setLoading(false)
    }
  }, [campaignId, productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void ensure()
  }, [ensure])

  // While the product ICP generates, poll it and re-attempt the clone once ready.
  const productGenerating = blocked && productIcp?.status === "generating"
  useEffect(() => {
    if (!productGenerating || productId == null) return
    const timer = setInterval(async () => {
      try {
        const latest = await icpService.get(productId)
        setProductIcp(latest)
        if (latest.status === "ready") void ensure()
      } catch {
        /* transient — keep polling */
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [productGenerating, productId, ensure])

  async function handleGenerateProduct() {
    if (productId == null) return
    setStarting(true)
    try {
      setProductIcp(await icpService.generate(productId))
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't start ICP generation.",
      )
    } finally {
      setStarting(false)
    }
  }

  async function handleSubmit(payload: IcpUpdate) {
    setSubmitting(true)
    try {
      await campaignIcpService.update(campaignId, payload)
      onApprove()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the ICP.")
      setSubmitting(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      const fresh = await campaignIcpService.reset(campaignId)
      setIcp(fresh)
      setFormKey((k) => k + 1)
      toast.success("Reset to the product's ICP.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't reset the ICP.",
      )
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Product ICP not ready — show its state with a way forward.
  if (blocked && !icp) {
    if (productGenerating) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Generating the product's ICP…</p>
          <p className="max-w-md text-xs text-muted-foreground">
            We'll copy it to this campaign as soon as it's ready.
          </p>
        </div>
      )
    }
    const failed = productIcp?.status === "failed"
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
          {failed ? (
            <TriangleAlert className="size-6 text-destructive" />
          ) : (
            <Sparkles className="size-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {failed ? "The product's ICP failed to generate" : "This product has no ICP yet"}
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            The campaign's ideal customer profile is copied from its product.
            Generate the product's ICP to continue.
          </p>
          {failed && productIcp?.error && (
            <p className="text-xs text-destructive">{productIcp.error}</p>
          )}
          <Button onClick={handleGenerateProduct} disabled={starting || productId == null}>
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {failed ? "Try again" : "Generate ICP"}
          </Button>
        </div>
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  if (!icp) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Ideal customers</h2>
        <p className="text-sm text-muted-foreground">
          This is a copy of the product's ideal customer profile, just for this
          campaign. Make any final edits, then approve to find matching contacts.
          Editing it here won't change the product's ICP.
        </p>
      </div>
      <ICPForm
        key={formKey}
        icp={icp}
        onSubmit={handleSubmit}
        submitting={submitting}
        scrollFields
        submitLabel="Approve & continue"
        submitIcon={<ArrowRight className="size-4" />}
        leftActions={
          <>
            <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={submitting || resetting}
            >
              {resetting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Reset to product ICP
            </Button>
          </>
        }
      />
    </div>
  )
}
