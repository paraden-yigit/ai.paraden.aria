import { useState } from "react"
import { Building2, ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"

/** Minimal structural shapes the accordion needs — both the upload-review and
 * discovery company/contact types satisfy these. */
export interface AccordionContact {
  full_name: string | null
  job_title: string | null
  email: string | null
  linkedin_url: string | null
}

export interface AccordionCompany {
  name: string | null
  domain: string | null
  industry: string | null
  contacts: AccordionContact[]
}

/** A list of companies as expandable rows; expanding one reveals its contacts.
 * Shared by the upload-review and discovery steps. The list scrolls within a
 * bounded height so the wizard always fits the page. */
export function CompaniesAccordion({ companies }: { companies: AccordionCompany[] }) {
  return (
    <div className="max-h-[45vh] divide-y overflow-y-auto rounded-lg border">
      {companies.map((company, index) => (
        <CompanyRow key={`${company.domain ?? company.name ?? "co"}-${index}`} company={company} />
      ))}
    </div>
  )
}

function CompanyRow({ company }: { company: AccordionCompany }) {
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
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
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
          <ContactsTable contacts={company.contacts} />
        </div>
      )}
    </div>
  )
}

export function ContactsTable({ contacts }: { contacts: AccordionContact[] }) {
  if (contacts.length === 0) {
    return <p className="p-3 text-xs text-muted-foreground">No contacts.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Job title</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">LinkedIn</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={index} className="border-t">
              <td className="px-3 py-2">{contact.full_name || "Unnamed"}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.job_title || "No title"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.email || "No email yet"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.linkedin_url ? (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Profile
                  </a>
                ) : (
                  "None"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
