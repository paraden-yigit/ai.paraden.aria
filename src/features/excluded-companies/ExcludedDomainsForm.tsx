import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Paste a list of domains, one per line, and exclude all of them at once.
 *
 * There is no name field: when you are adding fifty companies the domain is the
 * only thing you have, so the API names each entry after its domain. Parsing is
 * forgiving (commas and semicolons split too, blank lines are ignored) because
 * pasted lists arrive in whatever shape the spreadsheet they came from had.
 */
function parseDomains(text: string): string[] {
  const seen = new Set<string>()
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

interface ExcludedDomainsFormProps {
  onSubmit: (domains: string[]) => Promise<void>
  onCancel?: () => void
  submitting?: boolean
}

export function ExcludedDomainsForm({
  onSubmit,
  onCancel,
  submitting,
}: ExcludedDomainsFormProps) {
  const [text, setText] = useState("")
  const domains = useMemo(() => parseDomains(text), [text])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (domains.length > 0) void onSubmit(domains)
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="bulk-domains">Domains</Label>
        <Textarea
          id="bulk-domains"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={submitting}
          rows={10}
          className="font-mono text-sm"
          placeholder={"acme.com\nglobex.com\ninitech.com"}
        />
        <p className="text-sm text-muted-foreground">
          One domain per line. Each is added under its own domain as the name —
          anything that isn't a domain is reported back rather than saved.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <p className="mr-auto text-sm text-muted-foreground">
          {domains.length === 0
            ? "Nothing to add yet."
            : `${domains.length} domain${domains.length === 1 ? "" : "s"} ready to add.`}
        </p>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || domains.length === 0}>
          {submitting && <Loader2 className="animate-spin" />}
          Add domains
        </Button>
      </div>
    </form>
  )
}
