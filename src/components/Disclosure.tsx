import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A quiet, collapsed-by-default section. Lifted from the grouped-campaigns
 * pattern in `features/campaigns/CampaignCards.tsx` so disclosures read the same
 * wherever they appear, rather than adding a shadcn accordion for one shape.
 *
 * `onFirstOpen` fires once, the first time the section is opened. It exists so a
 * caller can defer an expensive fetch until someone actually asks for the
 * content: the campaign make-up costs up to 25 sequential requests, and most
 * visits never open it.
 */
export function Disclosure({
  id,
  label,
  icon: Icon,
  badge,
  defaultOpen = false,
  onFirstOpen,
  className,
  children,
}: {
  id: string
  label: string
  icon?: LucideIcon
  /** Small trailing pill, e.g. a count or "3 emails". */
  badge?: string
  defaultOpen?: boolean
  onFirstOpen?: () => void
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [everOpened, setEverOpened] = useState(defaultOpen)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && !everOpened) {
      setEverOpened(true)
      onFirstOpen?.()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-2 rounded-md py-1 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        )}
        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
        {label}
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
            {badge}
          </span>
        )}
      </button>
      {open && <div id={id}>{children}</div>}
    </div>
  )
}
