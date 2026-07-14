import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ICPForm } from "@/features/products/ICPForm"
import { icpService } from "@/services/icp.service"
import { ApiError } from "@/services/http"
import type { Icp, IcpUpdate } from "@/types/icp"

const POLL_INTERVAL_MS = 2000

interface ProductICPTabProps {
  productId: number
  /** Hide generate / regenerate / save controls and show the ICP read-only. */
  readOnly?: boolean
}

/**
 * ICP tab for a product: generate the Ideal Customer Profile from the product
 * brief + company info, poll while the agent runs, then show it in an editable
 * form. The ICP is stored per product and reused by every campaign on it.
 */
export function ProductICPTab({
  productId,
  readOnly = false,
}: ProductICPTabProps) {
  const [icp, setIcp] = useState<Icp | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setIcp(await icpService.get(productId))
    } catch (err) {
      // A 404 just means no ICP has been generated yet — not an error.
      if (err instanceof ApiError && err.status === 404) setIcp(null)
      else setLoadError(err instanceof ApiError ? err.message : "Failed to load ICP.")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Poll while the background agent is generating.
  useEffect(() => {
    if (icp?.status !== "generating") return
    const timer = setInterval(() => {
      icpService
        .get(productId)
        .then(setIcp)
        .catch(() => {
          /* transient error mid-generation — keep polling */
        })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [icp?.status, productId])

  async function handleGenerate() {
    setStarting(true)
    try {
      // Returns the row in the "generating" state, which kicks off polling.
      setIcp(await icpService.generate(productId))
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to start ICP generation.",
      )
    } finally {
      setStarting(false)
    }
  }

  async function handleSave(payload: IcpUpdate) {
    setSaving(true)
    try {
      setIcp(await icpService.update(productId, payload))
      toast.success("ICP saved.")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save ICP.")
    } finally {
      setSaving(false)
    }
  }

  const generating = icp?.status === "generating"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Ideal Customer Profile
          </h2>
          <p className="text-muted-foreground">
            The kind of company and contact this product's campaigns should target.
          </p>
        </div>
        {icp?.status === "ready" && !readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={starting}
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Regenerate
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : generating ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Generating ICP…</p>
              <p className="text-sm text-muted-foreground">
                The agent is analysing your company info and product brief. This
                usually takes a few seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : icp?.status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlert className="size-6 text-destructive" />
            <div>
              <p className="font-medium">ICP generation failed</p>
              <p className="text-sm text-muted-foreground">
                {icp.error ?? "Something went wrong while generating the ICP."}
              </p>
            </div>
            {!readOnly && (
              <Button onClick={handleGenerate} disabled={starting}>
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      ) : icp?.status === "ready" ? (
        <Card>
          <CardHeader>
            <CardTitle>Targeting profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ICPForm
              icp={icp}
              onSubmit={handleSave}
              submitting={saving}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-7 text-muted-foreground" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">No ICP generated yet</p>
              <p className="text-sm text-muted-foreground">
                {readOnly
                  ? "This product doesn't have an Ideal Customer Profile yet. An owner can generate one."
                  : "Generate an Ideal Customer Profile from your company info and this product's brief. You can edit every field afterwards."}
              </p>
            </div>
            {!readOnly && (
              <Button onClick={handleGenerate} disabled={starting}>
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate ICP
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
