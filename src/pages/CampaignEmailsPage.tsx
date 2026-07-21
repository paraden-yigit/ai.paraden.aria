import { useCallback, useEffect, useState } from "react"
import { AlertCircle, AtSign, Building2, Loader2, Mail } from "lucide-react"

import { DataState } from "@/components/DataState"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SavedSequence } from "@/features/campaigns/SavedSequence"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import { ApiError } from "@/services/http"
import { campaignContactService } from "@/services/campaign-contact.service"
import { campaignEmailService } from "@/services/campaign-email.service"
import type { CampaignContact } from "@/types/campaign-contact"
import type { CampaignContactEmail } from "@/types/campaign-email"

const PAGE_SIZE = 200
const MAX_PAGES = 50

function initials(name: string | null): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

/**
 * The campaign Emails tab: lists the reachable prospects (those with a work
 * email) and, on selecting one, slides over their generated outreach sequence.
 * The emails are written per-prospect by the post-launch generation job; while
 * that runs, a banner shows progress and the list fills in on refresh.
 */
export function CampaignEmailsPage() {
  const { campaign } = useCampaignContext()
  const campaignId = campaign.id

  const [contacts, setContacts] = useState<CampaignContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<CampaignContact | null>(null)
  const [emails, setEmails] = useState<CampaignContactEmail[] | null>(null)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsError, setEmailsError] = useState<string | null>(null)

  // Load all of the campaign's prospects, then keep only the reachable ones
  // (a work email is required to have any generated emails).
  const loadContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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
      setContacts(all.filter((c) => (c.email ?? "").trim() !== ""))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load prospects.")
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  // Refetch when generation finishes (campaign.updated_at changes) so newly
  // written emails surface without a manual reload.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContacts()
  }, [loadContacts, campaign.updated_at])

  // Fetch the selected prospect's emails when the sheet opens.
  useEffect(() => {
    if (selected === null) return
    let active = true
    setEmails(null)
    setEmailsLoading(true)
    setEmailsError(null)
    campaignEmailService
      .forContact(campaignId, selected.id)
      .then((rows) => {
        if (active) setEmails(rows)
      })
      .catch((err) => {
        if (active)
          setEmailsError(
            err instanceof ApiError ? err.message : "Failed to load emails.",
          )
      })
      .finally(() => {
        if (active) setEmailsLoading(false)
      })
    return () => {
      active = false
    }
  }, [selected, campaignId])

  const status = campaign.email_generation_status

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Emails</h2>
        <p className="text-muted-foreground">
          The outreach sequence generated for each reachable prospect. Select a
          prospect to read their emails.
        </p>
      </div>

      {status === "generating" && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          <span>
            Generating personalized emails for each prospect… this can take a
            while. Refresh to see them appear.
          </span>
        </div>
      )}
      {status === "failed" && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {campaign.email_generation_error ??
              "Email generation failed. Re-run the campaign to try again."}
          </span>
        </div>
      )}
      {status === "pending" && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Emails are generated once the campaign is launched.
        </div>
      )}

      <DataState
        loading={loading}
        error={error}
        isEmpty={contacts.length === 0}
        emptyMessage={
          status === "generating"
            ? "No emails yet — generation is still running."
            : "No reachable prospects yet. Prospects need a work email before emails can be generated."
        }
        onRetry={loadContacts}
        skeletonRows={6}
      >
        <ul className="divide-y rounded-lg border">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => setSelected(contact)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {initials(contact.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {contact.full_name || "Unnamed contact"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[contact.job_title, contact.company_name]
                      .filter(Boolean)
                      .join(" · ") || contact.email}
                  </p>
                </div>
                <Mail className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </DataState>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="pb-0">
                <SheetTitle>{selected.full_name || "Unnamed contact"}</SheetTitle>
                <SheetDescription className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <AtSign className="size-3.5 shrink-0" />
                    <span className="break-all">{selected.email}</span>
                  </span>
                  {selected.company_name && (
                    <span className="flex items-center gap-2">
                      <Building2 className="size-3.5 shrink-0" />
                      {selected.company_name}
                    </span>
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4">
                {emailsLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading emails…
                  </div>
                )}
                {emailsError && (
                  <p className="text-sm text-destructive">{emailsError}</p>
                )}
                {!emailsLoading && !emailsError && emails && emails.length > 0 && (
                  <SavedSequence campaign={campaign} emails={emails} />
                )}
                {!emailsLoading && !emailsError && emails && emails.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {status === "generating"
                      ? "This prospect's emails haven't been generated yet."
                      : "No emails were generated for this prospect."}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
