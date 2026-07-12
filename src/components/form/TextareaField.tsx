import type { Control, FieldPath, FieldValues } from "react-hook-form"

import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  /** Plain-language guidance rendered under the label. */
  description?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
}

/** Reusable RHF-bound textarea with label + validation message. */
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  rows = 3,
  disabled,
}: TextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
