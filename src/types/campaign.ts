/**
 * An outreach campaign owned by the authenticated user's client. Shape mirrors
 * the API's CampaignRead: a `name` plus the campaign-brief answers edited on the
 * campaign detail page (all free-text and optional for now).
 */
export interface Campaign {
  id: number
  client_id: number
  name: string
  offering: string | null
  audience: string | null
  problem_solved: string | null
  buyer_challenges: string | null
  proof_points: string | null
  buyer_outcome: string | null
  winning_emails: string | null
  supporting_data: string | null
  email_approver: string | null
  created_at: string
  updated_at: string
}

export interface CampaignCreate {
  name: string
  offering?: string | null
  audience?: string | null
  problem_solved?: string | null
  buyer_challenges?: string | null
  proof_points?: string | null
  buyer_outcome?: string | null
  winning_emails?: string | null
  supporting_data?: string | null
  email_approver?: string | null
}

export type CampaignUpdate = Partial<CampaignCreate>
