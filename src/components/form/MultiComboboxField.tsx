import { useMemo, useState } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

// Cap how many options render at once so a long list (hundreds) stays snappy;
// the user narrows it by typing.
const MAX_VISIBLE = 100

interface MultiComboboxFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  /** Plain-language helper rendered under the field. */
  description?: string
}

/**
 * RHF-bound searchable multi-select (combobox). Stores the selection as a
 * string[] (empty when none). The dropdown toggles membership and stays open;
 * picks render below as removable tags so the user can clear them without
 * reopening the menu.
 */
export function MultiComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  description,
}: MultiComboboxFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = (field.value as string[]) ?? []
        return (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <MultiCombobox
              selected={selected}
              onChange={field.onChange}
              options={options}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              disabled={disabled}
            />
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

interface MultiComboboxProps {
  selected: string[]
  onChange: (value: string[]) => void
  options: string[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
}

function MultiCombobox({
  selected,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q === "" ? options : options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  const visible = filtered.slice(0, MAX_VISIBLE)

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option],
    )
  }

  function remove(option: string) {
    onChange(selected.filter((o) => o !== option))
  }

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery("")
        }}
      >
        <FormControl>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between font-normal",
                selected.length === 0 && "text-muted-foreground",
              )}
            >
              <span className="truncate">
                {selected.length > 0 ? `${selected.length} selected` : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        </FormControl>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {visible.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No results.
              </div>
            ) : (
              visible.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option}</span>
                  </button>
                )
              })
            )}
            {filtered.length > visible.length && (
              <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                Showing {visible.length} of {filtered.length}. Keep typing to narrow.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((option) => (
            <Badge key={option} variant="secondary" className="gap-1 pr-1 font-normal">
              <span className="truncate">{option}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(option)}
                aria-label={`Remove ${option}`}
                className="rounded-sm opacity-60 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {selected.length > 1 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([])}
              className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
