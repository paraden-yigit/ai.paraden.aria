import { ExternalLink, FlaskConical, Microscope, Ban } from "lucide-react"

import { Disclosure } from "@/components/Disclosure"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ResearchFinding, ResearchFindingType } from "@/types/research"
import {
  RESEARCH_IS_SAMPLE_DATA,
  SAMPLE_RESEARCH_FINDINGS,
} from "./sampleResearch"

/** Plain-English label for the API's finding types. The API's own order of
 * priority: what the person said or did, then what the company did, then the
 * standing facts. */
const TYPE_LABEL: Record<ResearchFindingType, string> = {
  contact_action: "From the contact",
  company_event: "Company news",
  evergreen: "Background",
}

/** Just the host, as the visible text of a source link. The full URL is long,
 * repeats across findings, and tells the reader less than the publication does. */
function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Source"
  }
}

/**
 * Why the email opens the way it does: the scored, sourced findings behind it.
 *
 * Two bands of score tint rather than a five-step ramp, on the house rule that
 * near-identical shades read as a mistake instead of a system: 4 and 5 are the
 * ones worth writing about, everything below is context.
 */
function scoreTint(score: number): string {
  // The lower band keeps the full-strength foreground rather than the muted
  // one: muted on muted measures 4.37 in light mode, and a score is a number
  // someone has to read, not decoration. The green tint is what marks the
  // findings worth writing about.
  return score >= 4 ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
}

function Finding({ finding }: { finding: ResearchFinding }) {
  const host = sourceHost(finding.source_url)
  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            scoreTint(finding.relevance_score),
          )}
          // The number alone reads as a rank or a step index out of context.
          aria-label={`Relevance ${finding.relevance_score} out of 5`}
        >
          {finding.relevance_score}/5
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm">{finding.fact}</p>
          <p className="text-xs text-muted-foreground">
            {TYPE_LABEL[finding.type]} · {finding.date}
            {finding.recency === "recent" && " · last 6 months"}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {finding.relevance_reason}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-11">
        <a
          href={finding.source_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View the source for this finding on ${host}, opens in a new tab`}
          className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          {host}
        </a>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* aria-disabled rather than disabled: a disabled button leaves the
                tab order, which would put the only explanation of why it cannot
                be pressed out of reach of the keyboard. */}
            <button
              type="button"
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
              // Not dimmed further than the muted token: at this size a lighter
              // grey drops under AA, and the barred icon plus the cursor
              // already say it cannot be pressed.
              className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Ban className="size-3.5 shrink-0" aria-hidden="true" />
              Exclude and rewrite
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Dropping a source and rewriting the email from what is left needs
            backend support that is not live yet.
          </TooltipContent>
        </Tooltip>
      </div>
    </li>
  )
}

/**
 * The research sources behind the drafted email, on the wizard's preview step.
 *
 * Asked for by a client who wanted proof of the research the opening paragraph
 * quotes (28 July review). Preview only, by decision on the same call: once a
 * campaign is approved the sources stop being useful, so they are deliberately
 * not on the campaign dashboard.
 *
 * Collapsed by default. Findings come from `sampleResearch.ts` until there is a
 * user-scoped endpoint for them: the research really does run on this path and
 * is logged, but only `/api/admin/email-generation-logs` can read it back and
 * that needs an admin session.
 */
export function ResearchSources({ campaignId }: { campaignId: number }) {
  const findings = SAMPLE_RESEARCH_FINDINGS

  return (
    <Disclosure
      id={`research-sources-${campaignId}`}
      label="Research sources"
      icon={Microscope}
      badge={`${findings.length}`}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          What Paraden found about this prospect and their company before
          writing, scored against what you sell. The opening paragraph is built
          from the findings at the top.
        </p>

        {RESEARCH_IS_SAMPLE_DATA && (
          <div
            role="note"
            className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm"
          >
            <FlaskConical
              className="mt-0.5 size-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">
                Example sources. These are not this prospect's research.
              </p>
              <p className="text-muted-foreground">
                They show what the list will hold. The real findings appear here
                once they can be read from your account.
              </p>
            </div>
          </div>
        )}

        <ul className="divide-y rounded-lg border">
          {findings.map((finding) => (
            <Finding key={finding.source_url} finding={finding} />
          ))}
        </ul>
      </div>
    </Disclosure>
  )
}
