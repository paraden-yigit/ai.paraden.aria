import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, PenLine, Rocket } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmailBody } from "@/components/EmailBody"
import { Skeleton } from "@/components/ui/skeleton"
import { outreachService } from "@/services/outreach.service"
import type { OutreachEmail, OutreachProspect, OutreachRun } from "@/types/outreach"
import { StepFrame } from "./StepFrame"

const POLL_MS = 4000

/**
 * The last step: write everyone's emails, read some, then launch.
 *
 * Composing and launching are deliberately two presses. Composing produces copy
 * you can actually read before anything is queued; launching is the approval.
 * Collapsing them would mean the first time anyone sees a real email is after it
 * has gone.
 */
export function StepReview({
  run,
  onRunChange,
}: {
  run: OutreachRun
  onRunChange: (run: OutreachRun) => void
}) {
  const navigate = useNavigate()
  const [prospects, setProspects] = useState<OutreachProspect[]>([])
  const [preview, setPreview] = useState<OutreachEmail[]>([])
  const [previewOf, setPreviewOf] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [launching, setLaunching] = useState(false)
  const timer = useRef<number | null>(null)

  const refresh = useCallback(async () => {
    const next = await outreachService.get(run.id)
    onRunChange(next)
    return next
  }, [run.id, onRunChange])

  useEffect(() => {
    let active = true
    void (async () => {
      const page = await outreachService.listProspects(run.id, { limit: 10 })
      if (active) setProspects(page.items.filter((p) => p.reachable))
    })()
    return () => {
      active = false
    }
  }, [run.id, run.status])

  // Composing runs in the background; poll until it stops.
  useEffect(() => {
    if (run.status !== "composing") return
    const tick = async () => {
      const next = await refresh()
      if (next.status === "composing") {
        timer.current = window.setTimeout(tick, POLL_MS)
      }
    }
    timer.current = window.setTimeout(tick, POLL_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [run.status, refresh])

  async function compose() {
    try {
      const next = await outreachService.compose(run.id)
      onRunChange(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start.")
    }
  }

  async function showPreview(prospect: OutreachProspect) {
    setPreviewOf(prospect.id)
    try {
      setPreview(await outreachService.listEmails(run.id, prospect.id))
    } catch {
      toast.error("Could not load that sequence.")
    }
  }

  async function launch() {
    setLaunching(true)
    try {
      const result = await outreachService.launch(run.id)
      toast.success(
        result.blocked_reason
          ? `Launched, but nothing will send yet: ${result.blocked_reason}`
          : `Launched. ${result.enrolled} ${
              result.enrolled === 1 ? "prospect is" : "prospects are"
            } queued.`,
      )
      await refresh()
      navigate("/campaigns")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not launch.")
    } finally {
      setLaunching(false)
      setConfirming(false)
    }
  }

  return (
    <StepFrame
      title="Read a few, then launch"
      blurb="Every prospect's whole sequence is written in one pass. Read some before you commit — launching queues them for sending."
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">
            {run.reachable_count} of {run.prospect_count} can be emailed
          </CardTitle>
          {run.status === "draft" || run.status === "failed" ? (
            <Button onClick={() => void compose()}>
              <PenLine className="size-4" />
              Write the emails
            </Button>
          ) : run.status === "composing" ? (
            <Badge variant="outline">Writing…</Badge>
          ) : run.status === "launched" ? (
            <Badge>
              <CheckCircle2 className="mr-1 size-3" />
              Launched
            </Badge>
          ) : (
            <Button onClick={() => setConfirming(true)}>
              <Rocket className="size-4" />
              Launch
            </Button>
          )}
        </CardHeader>
        {run.compose_error && (
          <CardContent>
            <p className="text-sm text-destructive">{run.compose_error}</p>
          </CardContent>
        )}
      </Card>

      {run.status === "composing" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Researching each prospect and writing their whole sequence. This runs
            in the background — you can close this and come back.
          </p>
          <Skeleton className="h-24" />
        </div>
      )}

      {(run.status === "ready" || run.status === "launched") && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview a prospect</p>
            <div className="rounded-lg border">
              {prospects.map((prospect) => (
                <button
                  key={prospect.id}
                  type="button"
                  onClick={() => void showPreview(prospect)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50 ${
                    previewOf === prospect.id ? "bg-muted" : ""
                  }`}
                >
                  <span className="text-sm font-medium">
                    {prospect.full_name ||
                      [prospect.first_name, prospect.last_name]
                        .filter(Boolean)
                        .join(" ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {prospect.job_title || prospect.company_name || prospect.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {preview.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
                Choose someone to read their sequence.
              </div>
            ) : (
              preview.map((email) => (
                <Card key={email.id}>
                  <CardHeader className="gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Email {email.step_index}</Badge>
                      {email.approach && <Badge>{email.approach}</Badge>}
                    </div>
                    <CardTitle className="text-base">
                      {/* Follow-ups reply inside the opener's thread and inherit
                          its subject, so they have none of their own. */}
                      {email.subject || (
                        <span className="text-muted-foreground">
                          Reply in the opener's thread
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmailBody body={email.body} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Launch this run?"
        description={`${run.reachable_count} prospect${
          run.reachable_count === 1 ? "" : "s"
        } will be queued for sending. Their emails are already written — launching hands them to the sending schedule.`}
        confirmLabel="Launch"
        loading={launching}
        onConfirm={() => void launch()}
      />
    </StepFrame>
  )
}
