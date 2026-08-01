import { useEffect, useRef, useState } from "react"
import { ImageUp, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { clientService } from "@/services/client.service"
import { ApiError } from "@/services/http"

const MAX_BYTES = 1024 * 1024

/** Company logo — loads the stored logo and uploads replacements to the API. */
export function CompanyLogoCard() {
  const [logo, setLogo] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load the current logo (object URL) on mount; revoke it on cleanup/replace.
  useEffect(() => {
    let active = true
    let url: string | null = null
    void clientService.logoObjectUrl().then((objectUrl) => {
      if (!active) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        return
      }
      url = objectUrl
      setLogo(objectUrl)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (PNG, JPG or SVG).")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Keep the logo under 1 MB.")
      return
    }
    setUploading(true)
    try {
      await clientService.uploadLogo(file)
      setLogo((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      toast.success("Logo updated.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't upload the logo.",
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Company logo</CardTitle>
        <CardDescription>
          Make the workspace yours. PNG, JPG or SVG, up to 1 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        {logo ? (
          <>
            <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-6">
              <img
                src={logo}
                alt="Your workspace logo"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              Replace
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void handleFile(e.dataTransfer.files?.[0])
            }}
            className={
              "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors " +
              (dragging
                ? "border-ring bg-primary/5"
                : "border-border hover:border-ring/60 hover:bg-muted/40")
            }
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <ImageUp className="size-6 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">Upload your logo</span>
            <span className="text-xs text-muted-foreground">
              Click to choose a file, or drop one here.
            </span>
          </button>
        )}
      </CardContent>
    </Card>
  )
}
