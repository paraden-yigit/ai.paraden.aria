import { useCallback, useState } from "react"
import { Loader2, Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAsync } from "@/hooks/useAsync"
import { reachService } from "@/services/reach.service"
import type { OutreachRun } from "@/types/outreach"
import { ReachSlider } from "./ReachSlider"

const NUMBER = new Intl.NumberFormat("en-GB")

/**
 * The last look before a campaign starts.
 *
 * Two settings decide what happens the minute it does: how much of the sender's
 * allowance it may spend finding people, and how long the emails written for
 * them sit before any of them can leave. Both are on the Settings tab too — but
 * a campaign is only started once, and the wizard no longer asks for either, so
 * this is where they are confirmed rather than discovered afterwards.
 *
 * Reach has to be above zero. A campaign allocated nothing never looks for
 * anybody, and starting one is a button that would appear to do nothing at all.
 */
export function LaunchDialog({
  run,
  open,
  onOpenChange,
  onConfirm,
  launching,
}: {
  run: OutreachRun
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Save these, then start the campaign. */
  onConfirm: (settings: { monthly_reach: number; review_days: number }) => void
  launching: boolean
}) {
  const [reach, setReach] = useState<number>(run.monthly_reach ?? 0)
  const [reviewDays, setReviewDays] = useState(String(run.review_days ?? 0))

  const fetchAllowance = useCallback(
    () => reachService.allowance(run.id),
    [run.id],
  )
  const { data: allowance } = useAsync(fetchAllowance, [fetchAllowance])

  const unlimited = allowance?.unlimited ?? false
  const ceiling = allowance
    ? unlimited
      ? Math.max(100_000, reach * 2)
      : Math.max(allowance.available, reach, 1)
    : 1
  const free = Math.max(0, (allowance?.available ?? 0) - reach)

  const days = Number(reviewDays.trim())
  const daysInvalid =
    !reviewDays.trim() || !Number.isInteger(days) || days < 0 || days > 30

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start "{run.name}"?</DialogTitle>
          <DialogDescription>
            From the moment it starts, this campaign looks for people who match
            it and writes to them. Worth a last look at the two figures that
            decide how much and how soon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Label htmlFor="launch-reach">Reach</Label>
              <p className="text-xs text-muted-foreground tabular-nums">
                {allowance == null
                  ? "—"
                  : unlimited
                    ? "unlimited"
                    : `${NUMBER.format(allowance.available)} available · ${NUMBER.format(free)} free`}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="min-w-20 text-2xl font-semibold tabular-nums">
                {NUMBER.format(reach)}
              </span>
              <span className="text-sm text-muted-foreground">
                contacts a month
              </span>
            </div>
            <ReachSlider
              id="launch-reach"
              value={reach}
              onChange={setReach}
              max={ceiling}
            />
            {reach === 0 && (
              <p className="text-sm text-destructive">
                Nothing is allocated, so this campaign would not look for
                anybody. Move the slider to start it.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="launch-review-days">
              Days to review outgoing emails
            </Label>
            <Input
              id="launch-review-days"
              inputMode="numeric"
              className="max-w-40"
              value={reviewDays}
              onChange={(e) => setReviewDays(e.target.value)}
              aria-invalid={daysInvalid}
            />
            <p className="text-sm text-muted-foreground">
              Working days the written emails wait where you can read and edit
              them before the first one is allowed to leave. Zero sends as soon
              as the campaign is ready.
            </p>
            {daysInvalid && (
              <p className="text-sm text-destructive">
                A whole number of days, up to 30.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={launching}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={launching || daysInvalid || reach === 0}
            onClick={() =>
              onConfirm({ monthly_reach: reach, review_days: days })
            }
          >
            {launching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}
            {launching ? "Starting…" : "Start campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
