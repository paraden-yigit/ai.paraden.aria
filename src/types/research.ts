/**
 * Prospect research: the sourced findings the email agent writes the opening
 * paragraph from.
 *
 * Shape mirrors the API's research step exactly (`app/services/prospect_research.py`,
 * `RESEARCH_PROMPT_TEMPLATE`), which asks Claude with the web_search tool for 8 to
 * 12 discrete findings and drops any it cannot cite. The findings are stored as
 * the raw answer on `EmailGenerationLog.perplexity_response` and are currently
 * readable only through `/api/admin/email-generation-logs`, which needs an admin
 * session, so aria has no user-scoped way to fetch them yet. Typed here so that
 * wiring is a data-source swap when that endpoint lands, exactly as the Inbox
 * mirrors `EmailHistoryItem`.
 */

/** What kind of finding this is, in the API's own priority order: something the
 * contact personally said or did, a dated company event, or an evergreen fact. */
export type ResearchFindingType = "contact_action" | "company_event" | "evergreen"

/** Whether the finding falls inside the last six months. */
export type ResearchRecency = "recent" | "older"

export interface ResearchFinding {
  /** One plain factual sentence, no adjectives and no spin. */
  fact: string
  /** The day or month/year it happened or was published, or "undated". The
   * research prompt forbids guessing one. */
  date: string
  /** Where it was found. A finding without a working source is dropped before
   * it ever reaches here, so this is never empty. */
  source_url: string
  type: ResearchFindingType
  recency: ResearchRecency
  /** 0 to 5 against what the sender sells: high for a buying trigger or a clear
   * fit, 0 for anything unrelated. The API returns findings sorted by this,
   * highest first, and scoring never changes the fact itself. */
  relevance_score: number
  /** One line on why that score was given. */
  relevance_reason: string
}
