import { useState } from "react"
import {
  AtSign,
  Ban,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { SendingStatusBadge } from "@/features/campaigns/SendingStatusBadge"
import type { ContactSendingStatus } from "@/types/campaign-sending"

/** Minimal structural shapes the accordion needs — both the upload-review and
 * discovery company/contact types satisfy these. */
export interface AccordionContact {
  full_name: string | null
  job_title: string | null
  email: string | null
  linkedin_url: string | null
  /** Sending-queue state. Absent in the wizard (nothing is queued yet). */
  sending?: ContactSendingStatus | null
}

export interface AccordionCompany {
  name: string | null
  domain: string | null
  industry: string | null
  /** Company LinkedIn URL, when the caller has one (used by exclusion). */
  linkedin_url?: string | null
  contacts: AccordionContact[]
}

interface SelectedContact {
  contact: AccordionContact
  company: AccordionCompany | null
}

function initialsOf(name: string | null): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

/** A list of companies as expandable rows; expanding one reveals its contacts,
 * and clicking a contact opens a detail panel. The list scrolls within a
 * bounded height by default (the wizard needs to fit the page); pass a
 * `max-h-*` class via className to change or lift the bound. ``showEmail``
 * hides the email line where it isn't meaningful (discovered contacts have no
 * email yet). */
export function CompaniesAccordion({
  companies,
  className,
  showEmail = true,
  onExcludeCompany,
}: {
  companies: AccordionCompany[]
  className?: string
  showEmail?: boolean
  /** When given, the contact panel offers "Exclude this company" (the caller
   * owns the confirm + the API call). Needs a domain or LinkedIn URL to match
   * by, so the action only shows for companies carrying one. */
  onExcludeCompany?: (company: AccordionCompany) => void
}) {
  const [selected, setSelected] = useState<SelectedContact | null>(null)

  return (
    <>
      <div
        className={cn(
          "max-h-[45vh] divide-y overflow-y-auto rounded-lg border",
          className,
        )}
      >
        {companies.map((company, index) => (
          <CompanyRow
            key={`${company.domain ?? company.name ?? "co"}-${index}`}
            company={company}
            showEmail={showEmail}
            onSelect={(contact) => setSelected({ contact, company })}
          />
        ))}
      </div>
      <ContactSheet
        selected={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        onExcludeCompany={
          onExcludeCompany &&
          ((company) => {
            setSelected(null)
            onExcludeCompany(company)
          })
        }
      />
    </>
  )
}

function CompanyRow({
  company,
  showEmail,
  onSelect,
}: {
  company: AccordionCompany
  showEmail: boolean
  onSelect: (contact: AccordionContact) => void
}) {
  const [open, setOpen] = useState(false)
  const subtitle = [company.domain, company.industry].filter(Boolean).join(" · ")

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Building2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {company.name || company.domain || "Unnamed company"}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {company.contacts.length}{" "}
          {company.contacts.length === 1 ? "contact" : "contacts"}
        </Badge>
      </button>
      {open && (
        <div className="border-t bg-muted/20">
          <ContactsTable
            contacts={company.contacts}
            showEmail={showEmail}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  )
}

/** Contact rows: monogram, name and title, email state. With `onSelect` each
 * row is clickable and opens the caller's detail panel; ``showEmail`` hides
 * the email line (discovered contacts arrive without one). */
export function ContactsTable({
  contacts,
  showEmail = true,
  onSelect,
}: {
  contacts: AccordionContact[]
  showEmail?: boolean
  onSelect?: (contact: AccordionContact) => void
}) {
  if (contacts.length === 0) {
    return <p className="p-3 text-xs text-muted-foreground">No contacts.</p>
  }
  return (
    <ul className="divide-y">
      {contacts.map((contact, index) => {
        const inner = (
          <>
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
            >
              {initialsOf(contact.full_name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {contact.full_name || "Unnamed"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {contact.job_title || "No title"}
              </span>
            </span>
            {showEmail && (
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <AtSign className="size-3.5" />
                {contact.email || "No email yet"}
              </span>
            )}
            {contact.sending && (
              <span className="hidden shrink-0 sm:block">
                <SendingStatusBadge sending={contact.sending} />
              </span>
            )}
            {onSelect && (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </>
        )
        return (
          <li key={index}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(contact)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Slide-over with everything known about one contact. */
function ContactSheet({
  selected,
  onOpenChange,
  onExcludeCompany,
}: {
  selected: SelectedContact | null
  onOpenChange: (open: boolean) => void
  onExcludeCompany?: (company: AccordionCompany) => void
}) {
  const contact = selected?.contact
  const company = selected?.company
  // Exclusion matches by domain or LinkedIn URL; without either the API cannot
  // identify the company, so the action stays hidden.
  const excludable =
    company != null && (company.domain != null || company.linkedin_url != null)

  return (
    <Sheet open={selected !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {contact && (
          <>
            <SheetHeader className="pb-0">
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
              >
                {initialsOf(contact.full_name)}
              </span>
              <SheetTitle className="pt-2">
                {contact.full_name || "Unnamed contact"}
              </SheetTitle>
              <SheetDescription>
                {contact.job_title || "No job title on file"}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto p-4">
              <section className="space-y-2">
                <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                  Contact
                </h3>
                <p className="flex items-center gap-2 text-sm">
                  <AtSign className="size-4 shrink-0 text-muted-foreground" />
                  {contact.email ? (
                    <span className="break-all">{contact.email}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      No email address yet
                    </span>
                  )}
                </p>
                {contact.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      LinkedIn profile
                    </a>
                  </Button>
                )}
              </section>
              {contact.sending && (
                <section className="space-y-2">
                  <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                    Sending
                  </h3>
                  <SendingStatusBadge sending={contact.sending} />
                  {contact.sending.mailbox_email && (
                    <p className="text-sm text-muted-foreground">
                      Sending from {contact.sending.mailbox_email}
                    </p>
                  )}
                  {contact.sending.failure_reason && (
                    <p className="text-sm text-destructive">
                      {contact.sending.failure_reason}
                    </p>
                  )}
                </section>
              )}
              {company && (
                <section className="space-y-2">
                  <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                    Company
                  </h3>
                  <p className="flex items-center gap-2 text-sm">
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    {company.name || company.domain || "Unnamed company"}
                  </p>
                  {company.domain && (
                    <p className="text-sm text-muted-foreground">
                      {company.domain}
                    </p>
                  )}
                  {company.industry && (
                    <p className="text-sm text-muted-foreground">
                      {company.industry}
                    </p>
                  )}
                  {onExcludeCompany && excludable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onExcludeCompany(company)}
                    >
                      <Ban className="size-4" />
                      Exclude this company
                    </Button>
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
