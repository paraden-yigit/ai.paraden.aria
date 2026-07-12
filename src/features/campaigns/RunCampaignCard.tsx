import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { formatDateTime } from "@/lib/format"
import type { Campaign } from "@/types/campaign"

// PREVIEW STATE (for Yigit): the backend has no sending layer yet, so
// "running" is a purely visual state persisted per campaign in localStorage.
// Nothing is sent and no API call is made. The intended contract this design
// assumes: Run locks the prospect list and approved emails; changes afterwards
// mean pausing, or duplicating the campaign as a new draft (never re-running
// discovery). Replace with the real campaign state once sending exists.
const runKey = (id: number) => `aria-preview-running-${id}`

function readRunState(id: number): string | null {
  try {
    return localStorage.getItem(runKey(id))
  } catch {
    return null
  }
}

/** The lock-in moment: review the summary, run the campaign, see it running. */
export function RunCampaignCard({ campaign }: { campaign: Campaign }) {
  const [startedAt, setStartedAt] = useState<string | null>(() =>
    readRunState(campaign.id),
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleRun() {
    const stamp = new Date().toISOString()
    try {
      localStorage.setItem(runKey(campaign.id), stamp)
    } catch {
      // Storage blocked: the state just won't survive a reload.
    }
    setStartedAt(stamp)
    setConfirmOpen(false)
    toast.success("Campaign is running.", {
      description: "Preview: nothing sends until sending is switched on.",
    })
  }

  function handlePause() {
    try {
      localStorage.removeItem(runKey(campaign.id))
    } catch {
      // Ignore: state resets on reload anyway.
    }
    setStartedAt(null)
    toast("Campaign paused.", {
      description: "Your prospect list and emails are unchanged.",
    })
  }

  if (startedAt) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              Running
            </CardTitle>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <CardDescription>
            Started {formatDateTime(startedAt)}. ARIA works through your
            sequence exactly as you approved it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sending is not switched on in this build, so nothing has gone out
            yet. This shows how a running campaign will look.
          </p>
          <Button variant="outline" className="w-full" onClick={handlePause}>
            <Pause className="size-4" />
            Pause campaign
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ready to run</CardTitle>
          <CardDescription>
            Happy with the prospect list and the emails? Lock them in and let
            ARIA take it from here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!campaign.setup_completed && (
            <p className="text-sm text-muted-foreground">
              Finish this campaign's setup first.
            </p>
          )}
          <Button
            className="w-full"
            disabled={!campaign.setup_completed}
            onClick={() => setConfirmOpen(true)}
          >
            <Play className="size-4" />
            Run Campaign
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Run this campaign?"
        description={
          "Running locks your prospect list and approved emails so ARIA can work through the sequence exactly as you reviewed it. " +
          "If you want changes later, pause the campaign or duplicate it as a new draft: the contacts you found stay with you either way. " +
          "Preview note: sending is not switched on in this build, so nothing goes out yet."
        }
        confirmLabel="Run Campaign"
        onConfirm={handleRun}
      />
    </>
  )
}
