import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAsync } from "@/hooks/useAsync"
import { outreachService } from "@/services/outreach.service"
import { reachService } from "@/services/reach.service"
import type { OutreachRun } from "@/types/outreach"
import { ReachSlider } from "./ReachSlider"

const NUMBER = new Intl.NumberFormat("en-GB")

/** A number typed into a field, or null if it is not one. */
function parse(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** One of the three figures above the slider, fixed-width so it does not jump. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <>
      {label}{" "}
      <span className="inline-block min-w-14 text-right font-medium text-foreground">
        {value}
      </span>
    </>
  )
}

/**
 * The two things about a campaign you can change once it is going.
 *
 * Everything else the wizard set describes a campaign that has not started —
 * changing the profile or the sequence under one that has would contradict the
 * emails already written. These two only say what happens next: how much more
 * the pool may spend, and how long the next batch of emails waits before it can
 * leave.
 *
 * Reach is the only place this is set, now that the wizard no longer asks.
 *
 * Deleting the campaign lives here too, at the bottom and behind a confirmation
 * — it is the one thing on this page that cannot be undone, and the list is no
 * place for a one-click version of it.
 */
export function CampaignSettings({
  run,
  onSaved,
}: {
  run: OutreachRun
  onSaved: () => void
}) {
  const navigate = useNavigate()
  // Seeded once, from the campaign. The parent keys this component on the
  // campaign's `updated_at`, so a save re-mounts it and the fields come back
  // holding what was actually stored — which is why there is no effect here
  // copying props into state, and why the React Compiler is happy.
  const [reach, setReach] = useState<number | null>(run.monthly_reach)
  const [reviewDays, setReviewDays] = useState(String(run.review_days ?? 0))
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // What is left of the sender's allowance, with this campaign's own claim
  // excluded so it is not counted against itself.
  const fetchAllowance = useCallback(
    () => reachService.allowance(run.id),
    [run.id],
  )
  const { data: allowance } = useAsync(fetchAllowance, [fetchAllowance])

  const unlimited = allowance?.unlimited ?? false
  // What this campaign may take. An unlimited plan has no ceiling to draw a
  // slider against, so it gets a generous one; a workspace with no plan gets a
  // nominal one rather than a slider with nowhere to go.
  const ceiling = allowance
    ? unlimited
      ? Math.max(100_000, (reach ?? 0) * 2)
      : Math.max(allowance.available, reach ?? 0, 1)
    : 1
  // What would still be spare after this campaign takes its share. `available`
  // already excludes this campaign's stored claim, so this subtracts the figure
  // on screen rather than anything already counted.
  const free = Math.max(0, (allowance?.available ?? 0) - (reach ?? 0))

  const reviewValue = parse(reviewDays)
  const reviewInvalid = reviewValue === null || reviewValue > 30

  const dirty =
    reach !== (run.monthly_reach ?? null) ||
    reviewValue !== (run.review_days ?? 0)

  async function save() {
    if (reach === null || reviewValue === null) return
    setSaving(true)
    try {
      await outreachService.updateSettings(run.id, {
        monthly_reach: reach,
        review_days: reviewValue,
      })
      toast.success("Settings saved.")
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that.")
    } finally {
      setSaving(false)
    }
  }

  /** There is nothing to return to once this succeeds, so it leaves for the
   * list rather than re-reading a campaign that is gone. */
  async function remove() {
    setDeleting(true)
    try {
      await outreachService.remove(run.id)
      toast.success("Campaign deleted.")
      navigate("/campaigns")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete it.")
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="run-reach">Reach</Label>
          {/* The three figures the allocation is judged against: what the seat
            * gets in a month, what no other campaign has claimed, and what
            * would still be spare if this one were saved as it stands. Only the
            * last moves with the handle — a number that changes while you drag
            * and one that does not are different questions, and the wizard's
            * single "Available" answered both at once. */}
          <p className="text-xs text-muted-foreground tabular-nums">
            <Figure
              label="Total"
              value={
                allowance == null
                  ? "—"
                  : unlimited
                    ? "unlimited"
                    : NUMBER.format(allowance.monthly_reach)
              }
            />{" "}
            ·{" "}
            <Figure
              label="Available"
              value={
                allowance == null
                  ? "—"
                  : unlimited
                    ? "unlimited"
                    : NUMBER.format(allowance.available)
              }
            />{" "}
            ·{" "}
            <Figure
              label="Free"
              value={
                allowance == null
                  ? "—"
                  : unlimited
                    ? "unlimited"
                    : NUMBER.format(free)
              }
            />
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="min-w-20 text-2xl font-semibold tabular-nums">
            {NUMBER.format(reach ?? 0)}
          </span>
          <span className="text-sm text-muted-foreground">
            contacts a month
          </span>
        </div>
        <ReachSlider
          id="run-reach"
          value={reach}
          onChange={setReach}
          max={ceiling}
        />
        <p className="text-sm text-muted-foreground">
          How many contacts of your monthly reach this campaign may spend. The
          pool is kept two days deep against it, so lowering it slows what gets
          found rather than removing anybody already here.
        </p>
        {/* The wizard no longer asks for this, so a new campaign arrives with
          * nothing allocated — and a campaign with no allocation never fills
          * its pool. Said here, where it is fixed, rather than left as a
          * campaign that quietly does nothing. */}
        {run.monthly_reach === null && (
          <p className="text-sm text-destructive">
            Nothing is allocated yet, so this campaign will not look for anybody.
            Move the slider to start it filling.
          </p>
        )}
        {allowance != null && !unlimited && allowance.monthly_reach === 0 && (
          <p className="text-sm text-destructive">
            No plan is active on this workspace, so there is no reach to
            allocate yet.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-days">Days to review outgoing emails</Label>
        <Input
          id="review-days"
          inputMode="numeric"
          className="max-w-40"
          value={reviewDays}
          onChange={(e) => setReviewDays(e.target.value)}
          aria-invalid={reviewInvalid}
        />
        <p className="text-sm text-muted-foreground">
          Working days the written emails wait where you can read and edit them
          before the first one is allowed to leave. Zero sends as soon as the
          campaign is ready. The wait is spent once, at the start — the gaps
          between the steps of a sequence are unchanged.
        </p>
        <p className="text-sm text-muted-foreground">
          This applies to whoever is queued after you save it; anyone already
          waiting to be sent to keeps the window they were given.
        </p>
        {reviewInvalid && (
          <p className="text-sm text-destructive">
            A whole number of days, up to 30.
          </p>
        )}
      </div>

      <Button
        disabled={!dirty || saving || reach === null || reviewInvalid}
        onClick={() => void save()}
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saving ? "Saving…" : "Save settings"}
      </Button>

      {/* Below a rule and last on the page: everything above changes what the
        * campaign does next, this ends it. */}
      <div className="space-y-3 border-t pt-8">
        <div className="space-y-1">
          <h2 className="font-medium">Delete campaign</h2>
          <p className="text-sm text-muted-foreground">
            {run.status === "launched"
              ? "This campaign has been launched. Deleting it removes the setup, its list and everything written for it — anything already queued or sent is kept. This cannot be undone."
              : "This removes the campaign, its list and everything written for it. This cannot be undone."}
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={deleting}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="size-4" />
          Delete campaign
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={(open) => !deleting && setConfirmingDelete(open)}
        title={`Delete "${run.name}"?`}
        description={
          run.status === "launched"
            ? "This campaign has been launched. Deleting it removes the setup, its list and everything written for it; anything already queued or sent is kept. This cannot be undone."
            : "This removes the campaign, its list and everything written for it. This cannot be undone."
        }
        confirmLabel={deleting ? "Deleting…" : "Delete campaign"}
        loading={deleting}
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  )
}
