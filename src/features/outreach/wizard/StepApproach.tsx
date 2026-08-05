import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmailBody } from "@/components/EmailBody"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { outreachService } from "@/services/outreach.service"
import type { DraftStep, OutreachDraft } from "@/types/outreach"
import { StepFrame } from "./StepFrame"

const POLL_MS = 3000

const STEP_LABELS: Record<string, string> = {
  opener: "Opener",
  advancer: "Follow-up",
  closer: "Closer",
}

/**
 * The approach step — the one that decides how the whole run reads.
 *
 * Three genuinely different angles are written per step against the most
 * complete prospect on the list, and the one picked here becomes the *reference*
 * every other prospect's email is personalised from. That is why this is a
 * separate step rather than a setting: the choice is made once, by eye, on real
 * copy, and then applied consistently to everyone.
 *
 * Writing takes tens of seconds, so the request only starts the work and this
 * polls for it.
 */
export function StepApproach({
  runId,
  chosen,
  onChoose,
}: {
  runId: number
  /** `{step_index: approach name}` — what has been picked so far. */
  chosen: Record<number, string>
  onChoose: (step: DraftStep, approachName: string) => void
}) {
  const [draft, setDraft] = useState<OutreachDraft | null>(null)
  const [starting, setStarting] = useState(false)
  const timer = useRef<number | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await outreachService.getDraft(runId)
      setDraft(next)
      return next
    } catch {
      return null
    }
  }, [runId])

  // Poll only while there is something to wait for, and always clear on the way
  // out: a wizard step that keeps polling after it unmounts is a request every
  // three seconds for as long as the tab is open.
  useEffect(() => {
    let active = true
    const tick = async () => {
      const next = await load()
      if (!active) return
      if (next?.status === "generating") {
        timer.current = window.setTimeout(tick, POLL_MS)
      }
    }
    void tick()
    return () => {
      active = false
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [load])

  async function start() {
    setStarting(true)
    try {
      await outreachService.startDraft(runId)
      setDraft({ status: "generating", error: null, prospect: null, steps: [] })
      const tick = async () => {
        const next = await load()
        if (next?.status === "generating") {
          timer.current = window.setTimeout(tick, POLL_MS)
        }
      }
      timer.current = window.setTimeout(tick, POLL_MS)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start writing.",
      )
    } finally {
      setStarting(false)
    }
  }

  const status = draft?.status ?? "idle"
  const subject = draft?.prospect
  const writtenFor = subject
    ? [
        [subject.first_name, subject.last_name].filter(Boolean).join(" "),
        subject.job_title,
        subject.company_name,
      ]
        .filter(Boolean)
        .join(" · ")
    : null

  return (
    <StepFrame
      title="Pick the angle"
      blurb="Three different approaches per email, written against one real prospect. The one you pick becomes the reference every other prospect's email is personalised from."
    >
      {status === "idle" && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Sparkles className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="max-w-md text-sm text-muted-foreground">
            Nothing written yet. This takes a minute or so — it researches the
            prospect first, then writes.
          </p>
          <Button onClick={() => void start()} disabled={starting}>
            <Sparkles className="size-4" />
            Write the approaches
          </Button>
        </div>
      )}

      {status === "generating" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Researching the prospect and writing three angles per email…
          </p>
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {status === "failed" && (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium">The emails couldn't be written.</p>
          <p className="text-sm text-muted-foreground">
            {draft?.error ?? "Something went wrong."}
          </p>
          <Button variant="outline" onClick={() => void start()}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {writtenFor && (
              <p className="text-sm text-muted-foreground">
                Written for <span className="font-medium">{writtenFor}</span>
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => void start()}>
              <RefreshCw className="size-4" />
              Rewrite
            </Button>
          </div>

          {draft?.steps.map((step) => (
            <section key={step.step_index} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {STEP_LABELS[step.step_kind] ?? step.step_kind}
                </h3>
                <Badge variant="outline">Email {step.step_index}</Badge>
                {chosen[step.step_index] && (
                  <Badge>{chosen[step.step_index]}</Badge>
                )}
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                {step.approaches.map((approach) => {
                  const isChosen = chosen[step.step_index] === approach.name
                  return (
                    <button
                      key={approach.name}
                      type="button"
                      aria-pressed={isChosen}
                      onClick={() => onChoose(step, approach.name)}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                        isChosen
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/40",
                      )}
                    >
                      <span className="text-sm font-medium capitalize">
                        {approach.name}
                      </span>
                      {/* Only the opener has a subject — the rest reply into
                          its thread and inherit it. */}
                      {approach.subject && (
                        <span className="text-sm text-muted-foreground">
                          {approach.subject}
                        </span>
                      )}
                      <EmailBody
                        body={approach.body}
                        className="text-sm text-muted-foreground"
                      />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </StepFrame>
  )
}
