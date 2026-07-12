import { campaignContactService } from "@/services/campaign-contact.service"
import type { CampaignContact } from "@/types/campaign-contact"

// The contacts/list endpoint caps a page at 200; loop pages (same pattern as
// the Contacts tab) so the counts cover everyone in the campaign.
const PAGE_SIZE = 200
const MAX_PAGES = 25

export interface ContactStats {
  people: number
  companies: number
  reachable: number
}

/** Aggregate contact counts for a campaign: people, distinct companies, and
 * how many prospects have an email address on file. */
export async function loadContactStats(campaignId: number): Promise<ContactStats> {
  const all: CampaignContact[] = []
  for (let pageIdx = 0; pageIdx < MAX_PAGES; pageIdx++) {
    const res = await campaignContactService.list(campaignId, {
      skip: pageIdx * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
    all.push(...res.items)
    const total = res.total ?? all.length
    if (res.items.length === 0 || all.length >= total) break
  }
  const companies = new Set(
    all.map((c) => c.company_domain ?? c.company_name ?? `contact-${c.id}`),
  )
  return {
    people: all.length,
    companies: companies.size,
    reachable: all.filter((c) => !!c.email?.trim()).length,
  }
}
