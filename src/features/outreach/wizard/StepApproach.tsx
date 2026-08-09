import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailBody } from "@/components/EmailBody"
import { outreachPreviewService } from "@/services/outreachPreview.service"
import type {
  DraftProspect,
  DraftStep,
  OutreachPreview,
  PreviewStart,
} from "@/types/outreach"
import { StepFrame } from "./StepFrame"

const POLL_MS = 3000

/** Words in a generated body, as a reader would count them.
 *
 * The bodies are HTML fragments, so the tags come out first — otherwise
 * ``<p>`` and ``<br />`` would each count as a word and every email would read
 * a dozen words longer than it is. */
function wordCount(body: string): number {
  const text = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
  return text.split(/\s+/).filter(Boolean).length
}

const STEP_LABELS: Record<string, string> = {
  opener: "Opener",
  advancer: "Follow-up",
  closer: "Closer",
}

/**
 * The approach step — the one that decides how the whole run reads.
 *
 * Three genuinely different angles are written per step against one real
 * prospect, and the one picked here becomes the *reference* every other
 * prospect's email is personalised from. That is why this is a separate step
 * rather than a setting: the choice is made once, by eye, on real copy, and then
 * applied consistently to everyone.
 *
 * One email on screen at a time. Three side by side invited scanning for the
 * shortest rather than reading any of them, and these are judged by reading —
 * so the angles are tabs and the email under them is full width, laid out the
 * way an email client would.
 *
 * Writing takes tens of seconds, so the request only starts the work and this
 * polls for it.
 */
export function StepApproach({
  brief,
  chosen,
  onChoose,
  onToken,
}: {
  /** Everything the generator needs. There is no campaign to read it from: this
   * step runs before anything has been written. */
  brief: PreviewStart
  /** `{step_index: approach name}` — what has been picked so far. */
  chosen: Record<number, string>
  onChoose: (step: DraftStep, approachName: string) => void
  /** The preview the copy came from, so creating the campaign can read the
   * bodies back from it rather than posting them up from the browser. */
  onToken: (token: string) => void
}) {
  const [draft, setDraft] = useState<OutreachPreview | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const timer = useRef<number | null>(null)

  // Read inside the poll callback, which closes over a stale `chosen`
  // otherwise and would keep re-seeding over a pick the user just made.
  const chosenRef = useRef(chosen)
  useEffect(() => {
    chosenRef.current = chosen
  }, [chosen])

  /** Whatever tab a step opens on is its choice — there is no separate
   * confirm — so a freshly written draft arrives already chosen, and the step
   * can be left without touching anything. */
  const seedChoices = useCallback(
    (next: OutreachPreview | null) => {
      if (next?.status !== "ready") return
      for (const step of next.steps) {
        const first = step.approaches[0]
        if (first && !chosenRef.current[step.step_index]) {
          onChoose(step, first.name)
        }
      }
    },
    [onChoose],
  )

  const load = useCallback(async () => {
    if (!token) return null
    try {
      const next = await outreachPreviewService.get(token)
      setDraft(next)
      seedChoices(next)
      return next
    } catch {
      return null
    }
  }, [token, seedChoices])

  // Poll only while there is something to wait for, and always clear on the way
  // out: a wizard step that keeps polling after it unmounts is a request every
  // three seconds for as long as the tab is open.
  // Only a token has anything to poll for; before the first press there is
  // nothing written anywhere to ask about.
  useEffect(() => {
    if (!token) return
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
  }, [load, token])

  /** Start writing. `prospectIndex` is what "rewrite" asks for — the next
   * person along. */
  async function start(prospectIndex?: number) {
    setStarting(true)
    try {
      const started = await outreachPreviewService.start({
        ...brief,
        prospect_index: prospectIndex ?? 0,
      })
      setToken(started.token)
      onToken(started.token)
      setDraft({ ...started, status: "generating", prospect: null, steps: [] })
      // Poll this token rather than whatever `load` closes over: the state
      // above has not landed yet.
      const tick = async () => {
        try {
          const next = await outreachPreviewService.get(started.token)
          setDraft(next)
          seedChoices(next)
          if (next.status === "generating") {
            timer.current = window.setTimeout(tick, POLL_MS)
          }
        } catch {
          /* a failed poll is retried by the next tick */
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
  const subject = draft?.prospect ?? null
  // Naming who it is working on beats "the prospect" when we know them, and a
  // rewrite keeps the old subject on hand while the new copy is written.
  const researchSubject =
    [subject?.first_name, subject?.company_name].filter(Boolean).join(" at ") ||
    "the prospect"

  return (
    <StepFrame
      title="Pick the angle"
      blurb="Three approaches per email, written against one real prospect. The one you pick becomes the reference every other prospect's email is personalised from."
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

      {/* A spinner and a sentence, not skeletons: skeletons promise a shape
        * that is about to appear in a moment, and this is a minute of research
        * and writing. Saying what is happening is more honest than miming it. */}
      {status === "generating" && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <Loader2
            className="size-7 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-lg font-semibold">Writing your outreach sequence…</p>
          <p className="max-w-lg text-muted-foreground">
            Our agent is researching {researchSubject} and drafting a few
            approaches for each step, from your brand profile, product and
            outreach instructions. This can take a moment.
          </p>
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
          {subject && (
            <ProspectCard
              prospect={subject}
              busy={starting}
              // Rewriting moves on: the same prospect would mostly produce the
              // same three angles, and seeing them against somebody else is
              // what tells you whether an angle travels.
              onRewrite={() => void start(subject.index + 1)}
            />
          )}

          {draft?.steps.map((step) => (
            <StepApproaches
              key={step.step_index}
              step={step}
              chosen={chosen[step.step_index]}
              onChoose={(name) => onChoose(step, name)}
            />
          ))}
        </div>
      )}
    </StepFrame>
  )
}

/** Who this preview was written against, and a way to see it written for
 * somebody else — a single prospect can flatter or flatten every angle. */
function ProspectCard({
  prospect,
  busy,
  onRewrite,
}: {
  prospect: DraftProspect
  busy: boolean
  onRewrite: () => void
}) {
  const name =
    [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || null
  const initials =
    (name ?? prospect.company_name ?? "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "?"
  const heading = [name, prospect.company_name].filter(Boolean).join(" · ")
  const sub = [prospect.job_title, prospect.company_domain]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
      <div
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{heading || "One of your pool"}</p>
        {sub && (
          <p className="truncate text-sm text-muted-foreground">{sub}</p>
        )}
      </div>
      <Button variant="outline" disabled={busy} onClick={onRewrite}>
        <RefreshCw className="size-4" />
        Rewrite
      </Button>
    </div>
  )
}

/** One sequence step: its angles as tabs, and the chosen angle's email below. */
function StepApproaches({
  step,
  chosen,
  onChoose,
}: {
  step: DraftStep
  chosen: string | undefined
  onChoose: (approachName: string) => void
}) {
  // The tabs own what is on screen; the chosen angle only decides where they
  // start. Deriving the shown tab from `chosen` instead would pin the panel to
  // the picked angle and make every other tab unclickable.
  const [showing, setShowing] = useState(chosen ?? step.approaches[0]?.name ?? "")

  // A choice made elsewhere still moves the tabs: `chosen` arrives after mount
  // on a resumed run, and picking an angle should leave it on screen.
  const [followed, setFollowed] = useState(chosen)
  if (chosen !== followed) {
    setFollowed(chosen)
    if (chosen) setShowing(chosen)
  }

  const approach =
    step.approaches.find((a) => a.name === showing) ?? step.approaches[0]
  if (!approach) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-medium">
          {STEP_LABELS[step.step_kind] ?? step.step_kind}
        </h3>
        <Badge variant="outline">Email {step.step_index}</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={showing}
          onValueChange={(name) => {
            setShowing(name)
            // Reading an angle is choosing it. A confirm button on top of the
            // tab asked twice for one decision, and left a run half-picked
            // when the second press was missed.
            onChoose(name)
          }}
        >
          <TabsList>
            {step.approaches.map((option) => (
              <TabsTrigger
                key={option.name}
                value={option.name}
                className="capitalize"
              >
                {option.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground tabular-nums">
          {wordCount(approach.body)} words
        </p>
      </div>

      {/* Laid out the way a mail client would: the subject on its own line above
        * a rule, then the body. Only the opener has one — the rest reply into
        * its thread and inherit it. */}
      <article className="rounded-lg border p-5">
        {approach.subject && (
          <header className="mb-4 border-b pb-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Subject
            </p>
            <p className="mt-1 font-medium">{approach.subject}</p>
          </header>
        )}
        <EmailBody body={approach.body} className="text-sm" />
      </article>
    </section>
  )
}
