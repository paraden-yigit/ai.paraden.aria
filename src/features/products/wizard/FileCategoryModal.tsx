import { useEffect, useState } from "react"
import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FILE_CATEGORIES } from "@/types/product"

interface FileCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The name of the file being tagged (shown, read-only). */
  fileName: string | null
  /** Called with the chosen category value once confirmed. */
  onConfirm: (category: string) => void
  /** Fired when the modal is dismissed without tagging (discard the file). */
  onCancel?: () => void
}

/**
 * Modal shown after a file is selected/dropped: displays the file name and asks
 * the user to tag it with a category before it's added. A category is required.
 */
export function FileCategoryModal({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  onCancel,
}: FileCategoryModalProps) {
  const [category, setCategory] = useState<string>("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setCategory("")
  }, [open])

  function handleConfirm() {
    if (!category) return
    onConfirm(category)
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) onCancel?.()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tag this file</DialogTitle>
          <DialogDescription>
            Choose a category so we know how to use it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate text-sm font-medium">
              {fileName ?? "File"}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="file-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FILE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!category}>
            Add file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
