import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Campaign } from "@/types/campaign"

interface ResumeCampaignDialogProps {
  /** The incomplete campaign, or null when the dialog is closed. */
  campaign: Campaign | null
  resetting: boolean
  onClose: () => void
  onContinue: () => void
  onStartOver: () => void
}

/**
 * Prompt shown when a user opens a campaign whose setup was never finished:
 * continue where they left off, or start over from the contact-upload step.
 * Shared by the campaign grid cards and the dashboard spotlight card.
 */
export function ResumeCampaignDialog({
  campaign,
  resetting,
  onClose,
  onContinue,
  onStartOver,
}: ResumeCampaignDialogProps) {
  return (
    <Dialog
      open={campaign !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finish setting up this campaign?</DialogTitle>
          <DialogDescription>
            You left the setup for “{campaign?.name}” incomplete. Continue where
            you left off, or start over from the contact-upload step. Starting
            over clears any uploaded and discovered contacts but keeps the
            campaign name and product.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onStartOver} disabled={resetting}>
            {resetting && <Loader2 className="size-4 animate-spin" />}
            Start over
          </Button>
          <Button onClick={onContinue} disabled={resetting}>
            Continue setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
