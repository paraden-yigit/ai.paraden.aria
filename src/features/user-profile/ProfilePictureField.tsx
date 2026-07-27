import { useEffect, useRef, useState } from "react"
import { ImageUp, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"
import type { User } from "@/types/auth"

const MAX_BYTES = 1024 * 1024

function initialsOf(user: User): string {
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.full_name
  if (!name) return "U"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

interface ProfilePictureFieldProps {
  user: User
  /** Called after a successful upload so the cached user can be refreshed. */
  onUploaded: () => void | Promise<void>
  disabled?: boolean
}

/**
 * Profile picture — loads the stored avatar (if any) and uploads replacements
 * immediately via POST /api/auth/me/avatar (a separate call from the profile
 * text fields' Save). Mirrors the company-logo upload pattern.
 */
export function ProfilePictureField({
  user,
  onUploaded,
  disabled,
}: ProfilePictureFieldProps) {
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load the current avatar (object URL) on mount; revoke it on cleanup/replace.
  useEffect(() => {
    if (!user.has_avatar) return
    let active = true
    let url: string | null = null
    void authService.avatarObjectUrl().then((objectUrl) => {
      if (!active) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        return
      }
      url = objectUrl
      setAvatar(objectUrl)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [user.has_avatar])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (PNG, JPG or SVG).")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Keep the picture under 1 MB.")
      return
    }
    setUploading(true)
    try {
      await authService.uploadAvatar(file)
      setAvatar((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      await onUploaded()
      toast.success("Profile picture updated.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't upload the picture.",
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
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
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {avatar ? (
          <img
            src={avatar}
            alt="Your profile picture"
            className="size-full object-cover"
          />
        ) : (
          <span className="text-xl font-medium text-muted-foreground">
            {initialsOf(user)}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageUp className="size-4" />
          )}
          {avatar ? "Change picture" : "Upload picture"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG or SVG, up to 1 MB.
        </p>
      </div>
    </div>
  )
}
