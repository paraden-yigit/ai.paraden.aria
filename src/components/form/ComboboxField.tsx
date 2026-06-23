import { useMemo, useState } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

// Cap how many options render at once so a long list (hundreds) stays snappy;
// the user narrows it by typing.
const MAX_VISIBLE = 100

interface ComboboxFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}

/**
 * RHF-bound searchable single-select (combobox). Stores the selected option as
 * a string ("" when none). Picking the current value again clears it.
 */
export function ComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
}: ComboboxFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Combobox
            value={(field.value as string) ?? ""}
            onChange={field.onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            disabled={disabled}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
}

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
}: ComboboxProps) {
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
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">{value || placeholder}</span>
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
