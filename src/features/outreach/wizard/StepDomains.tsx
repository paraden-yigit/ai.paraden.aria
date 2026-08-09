import { Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { extractDomains, splitPasted } from "@/lib/domains"
import { isSpreadsheetFile, readFirstColumn } from "@/lib/spreadsheet"
import { DomainSource } from "../DomainSource"
import type { OutreachIcpDraft } from "@/types/outreach"
import { ProfileField } from "./ProfileField"
import { StepFrame } from "./StepFrame"

interface StepDomainsProps {
  value: OutreachIcpDraft
  onChange: (next: OutreachIcpDraft) => void
}

/**
 * The company half of a Strategic run: the companies, named outright.
 *
 * Where a Flow run describes the companies it wants and lets us go and find
 * them, a Strategic run already knows them — so this step takes a list of
 * domains rather than a set of filters. Everything after it is the same as Flow,
 * including the next step: who at these companies, and how many of them there
 * are.
 *
 * Only the first column is read, and only domains come out of it. A header cell,
 * a company name or a stray note is not a value worth guessing at, so it is
 * counted as skipped and reported rather than quietly corrected (see
 * `lib/domains`).
 */
export function StepDomains({ value, onChange }: StepDomainsProps) {
  const domains = value.company_domains

  function setDomains(next: string[]) {
    onChange({ ...value, company_domains: next })
  }

  /** Add what was found, and say what happened to the rest. */
  function absorb(values: string[], source: string) {
    const found = extractDomains(values, domains)
    if (found.domains.length === 0) {
      toast.error(
        found.skipped.length || found.duplicates
          ? "No new domains in that — everything was either already on the list or not a domain."
          : `Nothing to read in ${source}.`,
      )
      return
    }
    setDomains([...domains, ...found.domains])

    const notes: string[] = []
    if (found.duplicates) notes.push(`${found.duplicates} already on the list`)
    if (found.skipped.length) {
      notes.push(
        `${found.skipped.length} skipped (${found.skipped.slice(0, 2).join(", ")}${
          found.skipped.length > 2 ? "…" : ""
        })`,
      )
    }
    toast.success(
      `Added ${found.domains.length} ${
        found.domains.length === 1 ? "domain" : "domains"
      }${notes.length ? ` · ${notes.join(" · ")}` : ""}`,
    )
  }

  async function handleFile(file: File) {
    if (!isSpreadsheetFile(file)) {
      toast.error("That file type isn't supported. Use a CSV or Excel file.")
      return
    }
    try {
      absorb(await readFirstColumn(file), file.name)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read that file.",
      )
    }
  }

  return (
    <StepFrame
      title="Which companies should we look inside?"
      blurb="Upload the companies you already know you want. One column of domains is all we need — the next step is who to reach at them."
    >
      {/* Once there is a list, the list is the step: the drop zone and the paste
        * box have done their job and would only compete with it. Clearing the
        * list brings them back, which is what starting over means here. */}
      {domains.length === 0 ? (
        <DomainSource
          onFile={handleFile}
          onPaste={(text) => absorb(splitPasted(text), "that")}
        />
      ) : (
        <ProfileField
          label={`${domains.length} ${domains.length === 1 ? "company" : "companies"}`}
          description="Anything that wasn't a domain was left out. Remove any you did not mean to include, or clear the list to upload a different file."
        >
          {() => (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
              {domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <span className="truncate">{domain}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${domain}`}
                    onClick={() =>
                      setDomains(domains.filter((d) => d !== domain))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ProfileField>
      )}

      {domains.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDomains([])}
          >
            <Trash2 className="size-4" />
            Clear all
          </Button>
        </div>
      )}
    </StepFrame>
  )
}
