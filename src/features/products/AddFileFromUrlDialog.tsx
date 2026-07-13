import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { productService } from "@/services/product.service"
import { ApiError } from "@/services/http"

interface AddFileFromUrlDialogProps {
  productId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the URL is successfully ingested (e.g. to refetch the list). */
  onAdded?: () => void
}

/**
 * Modal for adding a supporting file from a URL. The server fetches the page and
 * extracts its text just like an uploaded file, so the new row appears "Queued"
 * and the list poll advances it.
 */
export function AddFileFromUrlDialog({
  productId,
  open,
  onOpenChange,
  onAdded,
}: AddFileFromUrlDialogProps) {
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // Clear the field whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) setUrl("")
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await productService.addFileFromUrl(productId, trimmed)
      toast.success("Fetching content from the URL.")
      onOpenChange(false)
      onAdded?.()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't add the file from URL.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add from URL</DialogTitle>
            <DialogDescription>
              Paste a link and we'll fetch its contents and extract the text,
              just like an uploaded file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="supporting-file-url">URL</Label>
            <Input
              id="supporting-file-url"
              type="url"
              inputMode="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              autoFocus
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
