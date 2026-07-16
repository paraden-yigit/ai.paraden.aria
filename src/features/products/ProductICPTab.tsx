import { useCallback, useEffect, useState } from "react"
import {
  Loader2,
  PencilRuler,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ICPForm } from "@/features/products/ICPForm"
import { IcpOverview } from "@/features/products/IcpOverview"
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
  // "overview" is the readable, safe-to-browse face; "edit" is the fine-tune form.
  const [mode, setMode] = useState<"overview" | "edit">("overview")
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

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
      setMode("overview")
      setConfirmRegenerate(false)
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
      toast.success("Profile saved.")
      setMode("overview")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save the profile.",
      )
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
            Who this product's campaigns target
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Campaigns use this profile when they search for companies and
            people. Edit it freely: changes only take effect the next time a
            campaign runs a search.
          </p>
        </div>
        {icp?.status === "ready" && !readOnly && (
          <div className="flex shrink-0 gap-2">
            {mode === "overview" && (
              <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                <PencilRuler className="size-4" />
                Fine-tune
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRegenerate(true)}
              disabled={starting}
            >
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Regenerate
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Regenerate this profile?"
        description="ARIA will write a fresh profile from your company info, product brief and supporting files. It replaces everything here, including any changes you have made yourself."
        confirmLabel="Regenerate"
        onConfirm={handleGenerate}
        loading={starting}
        destructive
      />

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
              <p className="font-medium">Writing your targeting profile…</p>
              <p className="text-sm text-muted-foreground">
                ARIA is reading your company info, product brief and
                supporting files. This usually takes a few seconds, and you
                can edit everything it writes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : icp?.status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlert className="size-6 text-destructive" />
            <div>
              <p className="font-medium">The profile could not be written</p>
              <p className="text-sm text-muted-foreground">
                Nothing was lost. Trying again usually resolves this.
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
        mode === "overview" || readOnly ? (
          <IcpOverview icp={icp} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Fine-tune the targeting</CardTitle>
            </CardHeader>
            <CardContent>
              <ICPForm
                icp={icp}
                onSubmit={handleSave}
                submitting={saving}
                onCancel={() => setMode("overview")}
              />
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-7 text-muted-foreground" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">No targeting profile yet</p>
              <p className="text-sm text-muted-foreground">
                {readOnly
                  ? "This product has no targeting profile yet. Someone who manages products can generate one."
                  : "ARIA reads your company info, this product's brief and any supporting files you have uploaded, then writes a profile of the companies and people worth contacting. You can edit everything afterwards, so nothing you do here is final."}
              </p>
            </div>
            {!readOnly && (
              <Button onClick={handleGenerate} disabled={starting}>
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate the profile
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
