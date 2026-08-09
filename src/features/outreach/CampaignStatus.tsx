import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { OutreachRun } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.round((part / whole) * 100))
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Meter({
  label,
  hint,
  value,
}: {
  label: string
  hint: string
  value: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}%</p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-[width]")}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

/**
 * Where the campaign has got to.
 *
 * Two different completions, which is why both are here. **Coverage** is people:
 * how many of the list have been written to at all. **Progress** is emails: how
 * much of the whole sequence has gone out. Ten prospects on a two-email sequence
 * is twenty emails, so openers to five of them is half the people and a quarter
 * of the work — one number would hide whichever half of that mattered.
 */
export function CampaignStatus({ run }: { run: OutreachRun }) {
  const poolSize = run.pool_total ?? 0
  // The list itself, once discovery fills it in. Until then a campaign has a
  // pool it could reach and no prospects it has.
  const prospects = run.prospect_count
  // Nothing tracks sends against a run yet, so these are the shape of the
  // answer rather than the answer.
  const contacted = 0
  const sent = 0

  const touches = run.sequence_touches ?? 0
  const plannedEmails = prospects * touches
  const running = formatDuration(run.launched_at)

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="font-semibold">Status</h2>
        <p className="text-sm text-muted-foreground">
          {running
            ? `Running for ${running}.`
            : "Not started — nothing has been sent yet."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Pool size" value={NUMBER.format(poolSize)} />
        <Figure
          label="Prospects contacted"
          value={
            prospects > 0
              ? `${NUMBER.format(contacted)} of ${NUMBER.format(prospects)}`
              : NUMBER.format(contacted)
          }
        />
        <Figure
          label="Emails sent"
          value={
            plannedEmails > 0
              ? `${NUMBER.format(sent)} of ${NUMBER.format(plannedEmails)}`
              : NUMBER.format(sent)
          }
        />
        <Figure label="Running for" value={running ?? "Not started"} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Meter
          label="Prospect coverage"
          value={percent(contacted, prospects)}
          hint={
            prospects > 0
              ? `${NUMBER.format(contacted)} of ${NUMBER.format(prospects)} prospects written to`
              : "No prospects on the list yet."
          }
        />
        <Meter
          label="Campaign progress"
          value={percent(sent, plannedEmails)}
          hint={
            plannedEmails > 0
              ? `${NUMBER.format(sent)} of ${NUMBER.format(plannedEmails)} emails — ${NUMBER.format(prospects)} prospects × ${touches} in the sequence`
              : "The sequence has nobody to send to yet."
          }
        />
      </div>
    </section>
  )
}
