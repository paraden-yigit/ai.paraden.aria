import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Cap rendered options so the long industry list (hundreds) stays snappy; the
// user narrows it by typing.
const MAX_VISIBLE = 100

interface IndustryComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}

/**
 * Standalone searchable single-select for the onboarding wizard. Same behaviour
 * as the RHF `ComboboxField`'s inner combobox, but without the form-context
 * dependency so it works with plain wizard state.
 */
export function IndustryCombobox({
  value,
  onChange,
  options,
  placeholder = "Select an industry…",
}: IndustryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q === "" ? options : options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  const visible = filtered.slice(0, MAX_VISIBLE)

  function pick(option: string) {
    onChange(option === value ? "" : option)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <div className="border-b p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {visible.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No results.
            </div>
          ) : (
            visible.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  option === value && "bg-accent",
                )}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    option === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option}</span>
              </button>
            ))
          )}
          {filtered.length > visible.length && (
            <div className="px-2 py-2 text-center text-xs text-muted-foreground">
              Showing {visible.length} of {filtered.length}. Keep typing to narrow.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
