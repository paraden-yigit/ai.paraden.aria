import type { ResearchFinding } from "@/types/research"

/**
 * The one flag that turns the research sources panel from preview to live.
 *
 * Flip to `false` when the findings come from the API instead of this file, and
 * the "example sources" note disappears with it. Same device as the Inbox's
 * `INBOX_IS_SAMPLE_DATA`, and for the same reason: research shown beside a real
 * email reads as proof, so it has to say plainly when it is not.
 */
export const RESEARCH_IS_SAMPLE_DATA = true

/**
 * Example findings, in the shape the research step really returns.
 *
 * Deliberately about a company that does not exist, on `example.com` links that
 * go nowhere, so nobody can mistake one of these for a claim about the prospect
 * on screen or click through expecting a real article. Ordered by
 * `relevance_score` descending, which is how the API sorts them.
 */
export const SAMPLE_RESEARCH_FINDINGS: ResearchFinding[] = [
  {
    fact: "Northwind Logistics said it will open depots in Poland and Czechia during the second half of the year.",
    date: "June 2026",
    source_url: "https://example.com/northwind/european-expansion",
    type: "company_event",
    recency: "recent",
    relevance_score: 5,
    relevance_reason:
      "Opening two new markets means hiring and new revenue targets, which is when teams look at outbound.",
  },
  {
    fact: "Dana Whitfield told a supply chain podcast that her team still books freight over the phone.",
    date: "12 May 2026",
    source_url: "https://example.com/podcasts/freight-weekly-114",
    type: "contact_action",
    recency: "recent",
    relevance_score: 5,
    relevance_reason:
      "The contact naming the manual process herself is the strongest opening you can quote.",
  },
  {
    fact: "Northwind Logistics appointed a first Head of Revenue Operations in April 2026.",
    date: "April 2026",
    source_url: "https://example.com/northwind/press/revops-hire",
    type: "company_event",
    recency: "recent",
    relevance_score: 4,
    relevance_reason:
      "A new revenue operations function usually arrives with a budget for tooling.",
  },
  {
    fact: "Dana Whitfield published a post arguing that quoting speed decides most freight tenders.",
    date: "3 March 2026",
    source_url: "https://example.com/posts/quoting-speed-wins-tenders",
    type: "contact_action",
    recency: "recent",
    relevance_score: 4,
    relevance_reason:
      "Gives you her own words on the problem, so the opener can agree with her rather than pitch at her.",
  },
  {
    fact: "Northwind Logistics runs 240 vehicles from four distribution centres in the United Kingdom.",
    date: "undated",
    source_url: "https://example.com/northwind/about",
    type: "evergreen",
    recency: "older",
    relevance_score: 3,
    relevance_reason:
      "Useful for sizing the account, but it is not a reason to write this week.",
  },
  {
    fact: "Northwind Logistics reported revenue of 48 million pounds in its 2025 annual accounts.",
    date: "September 2025",
    source_url: "https://example.com/filings/northwind-2025",
    type: "evergreen",
    recency: "older",
    relevance_score: 2,
    relevance_reason:
      "Confirms the company is inside your target size band and nothing more.",
  },
  {
    fact: "Northwind Logistics sponsored a regional charity half marathon in 2025.",
    date: "October 2025",
    source_url: "https://example.com/news/half-marathon-sponsors",
    type: "company_event",
    recency: "older",
    relevance_score: 0,
    relevance_reason: "No connection to what you sell.",
  },
]
