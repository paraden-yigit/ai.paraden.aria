import { useRef, useState } from "react"
import { ImageUp, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// PREVIEW (for Yigit): the API's client model has no logo field yet, so the
// image is kept as a data URL in localStorage and nothing is uploaded. Needs
// a real endpoint + storage; flagged in the PR and the handoff notes.
const LOGO_KEY = "aria-preview-company-logo"
const MAX_BYTES = 1024 * 1024

function readStoredLogo(): string | null {
  try {
    return localStorage.getItem(LOGO_KEY)
  } catch {
    return null
  }
}

/** Company logo upload with local preview. */
export function CompanyLogoCard() {
  const [logo, setLogo] = useState<string | null>(readStoredLogo)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (PNG, JPG or SVG).")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Keep the logo under 1 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      try {
        localStorage.setItem(LOGO_KEY, dataUrl)
      } catch {
        // Storage full or blocked: preview still shows for this visit.
      }
      setLogo(dataUrl)
      toast.success("Logo added.")
    }
    reader.readAsDataURL(file)
  }

  function handleRemove() {
    try {
      localStorage.removeItem(LOGO_KEY)
    } catch {
      // Nothing stored to remove.
    }
    setLogo(null)
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
            handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        {logo ? (
          <>
            <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-6">
              <img
                src={logo}
                alt="Your company logo"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => inputRef.current?.click()}
              >
                <ImageUp className="size-4" />
                Replace
              </Button>
              <Button variant="outline" onClick={handleRemove}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
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
              handleFile(e.dataTransfer.files?.[0])
            }}
            className={
              "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors " +
              (dragging
                ? "border-ring bg-primary/5"
                : "border-border hover:border-ring/60 hover:bg-muted/40")
            }
          >
            <ImageUp className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">Upload your logo</span>
            <span className="text-xs text-muted-foreground">
              Click to choose a file, or drop one here.
            </span>
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          Preview build: the logo stays on this device until uploads are wired
          up.
        </p>
      </CardContent>
    </Card>
  )
}
