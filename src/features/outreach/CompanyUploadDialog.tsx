import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { companyLimitError, extractDomains, splitPasted } from "@/lib/domains"
import { isSpreadsheetFile, readFirstColumn } from "@/lib/spreadsheet"
import { outreachService } from "@/services/outreach.service"
import { DomainSource } from "./DomainSource"

/**
 * Adding companies to a campaign that is already running.
 *
 * Literally the wizard's upload step: the same `DomainSource` control, the
 * same reading of a file — first column only, and `https://www.acme.com` and
 * `acme.com` are the same company — so a file that worked there works here.
 *
 * Adds rather than replaces: the campaign's current domains are read first and
 * the new ones merged in. The endpoint takes the whole list by design (removing
 * a domain in the browser is what removes it), so "add" has to be built from a
 * read and a write rather than assumed.
 */
export function CompanyUploadDialog({
  runId,
  open,
  onOpenChange,
  onUploaded,
}: {
  runId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}) {
  const [pending, setPending] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function absorb(values: string[]) {
    const found = extractDomains(values, pending)
    if (found.domains.length === 0) {
      toast.error(
        found.skipped.length || found.duplicates
          ? "No new domains in that — everything was either already listed or not a domain."
          : "Nothing to read in that.",
      )
      return
    }
    // Against what is staged here only — the campaign's own count is not known
    // until the save reads it, and that check is done there too.
    const overLimit = companyLimitError(pending.length, found.domains.length)
    if (overLimit) {
      toast.error(overLimit)
      return
    }
    setPending((current) => [...current, ...found.domains])
    if (found.skipped.length) {
      toast.info(
        `${found.skipped.length} row${found.skipped.length === 1 ? "" : "s"} skipped — not a domain.`,
      )
    }
  }

  async function handleFile(file: File) {
    if (!isSpreadsheetFile(file)) {
      toast.error("That file type isn't supported. Use a CSV or Excel file.")
      return
    }
    try {
      absorb(await readFirstColumn(file))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read that file.",
      )
    }
  }

  async function save() {
    setSaving(true)
    try {
      // The domains endpoint, not the companies list: that list is one page of
      // two kinds of company, and sending it back would drop the pages this
      // never saw and file discovered employers as uploaded ones.
      const existing = await outreachService.getCompanyDomains(runId)
      // The real total, at last: what is staged plus what the campaign already
      // holds. Checked before the write rather than after, since the endpoint
      // replaces the whole list.
      const overLimit = companyLimitError(existing.domains.length, pending.length)
      if (overLimit) {
        toast.error(overLimit)
        return
      }
      const domains = [...existing.domains, ...pending]
      const saved = await outreachService.saveCompanyDomains(runId, domains)
      const added = saved.domains.length - existing.domains.length
      toast.success(
        added > 0
          ? `Added ${added} ${added === 1 ? "company" : "companies"}.`
          : "Nothing new to add — those companies were already on the list.",
      )
      if (saved.excluded > 0) {
        toast.warning(
          `${saved.excluded} ${
            saved.excluded === 1 ? "domain is" : "domains are"
          } on your exclusion list and were not added.`,
        )
      }
      setPending([])
      onOpenChange(false)
      onUploaded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save them.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add companies</DialogTitle>
          <DialogDescription>
            A spreadsheet with the domains in its first column, or paste them
            one per line. Full URLs are fine — we keep the domain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <DomainSource
            onFile={(file) => void handleFile(file)}
            onPaste={(text) => absorb(splitPasted(text))}
          />

          {pending.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {pending.length} to add:{" "}
              <span className="text-foreground">
                {pending.slice(0, 4).join(", ")}
                {pending.length > 4 && ` and ${pending.length - 4} more`}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={pending.length === 0 || saving}
            onClick={() => void save()}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Adding…" : "Add to campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
