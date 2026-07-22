import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import type { Campaign } from "@/types/campaign"

/**
 * Shared "open a campaign" behaviour used by both the campaign grid cards and
 * the dashboard spotlight card. A completed campaign navigates straight to its
 * detail page; an incomplete one instead opens the resume dialog so the user
 * can continue where they left off or start over from the upload step.
 */
export function useResumeCampaign() {
  const navigate = useNavigate()
  const [incomplete, setIncomplete] = useState<Campaign | null>(null)
  const [resetting, setResetting] = useState(false)

  const open = useCallback(
    (campaign: Campaign) => {
      if (campaign.setup_completed) {
        navigate(`/campaigns/${campaign.id}`)
      } else {
        setIncomplete(campaign)
      }
    },
    [navigate],
  )

  const close = useCallback(() => {
    if (!resetting) setIncomplete(null)
  }, [resetting])

  const continueSetup = useCallback(() => {
    if (!incomplete) return
    navigate(`/campaigns/new?resume=${incomplete.id}&mode=continue`)
  }, [incomplete, navigate])

  const startOver = useCallback(async () => {
    if (!incomplete) return
    setResetting(true)
    try {
      await campaignService.reset(incomplete.id)
      navigate(`/campaigns/new?resume=${incomplete.id}&mode=restart`)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reset the campaign.",
      )
      setResetting(false)
    }
  }, [incomplete, navigate])

  return { incomplete, resetting, open, close, continueSetup, startOver }
}
