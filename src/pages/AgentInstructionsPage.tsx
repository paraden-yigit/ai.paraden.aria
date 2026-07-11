import { useCallback, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { agentInstructionsService } from "@/services/agent-instructions.service"
import { ApiError } from "@/services/http"

/**
 * Single free-text editor for the client's outreach AI agent instructions:
 * banned words, patterns to avoid, tone rules, etc. Instructions are scoped to
 * the client (not the user), so everyone on the account edits the same block.
 */
export function AgentInstructionsPage() {
  const load = useCallback(() => agentInstructionsService.get(), [])
  const { data, loading, error, refetch } = useAsync(load, [])

  // Local, editable copy. `baseline` is the last saved value, used to detect
  // unsaved changes.
  const [value, setValue] = useState("")
  const [baseline, setBaseline] = useState("")
  const [saving, setSaving] = useState(false)

  // Seed the editor from the loaded data using React's render-phase state-sync
  // pattern: when a new `data` object arrives (initial load), reset the editor.
  const [seededFrom, setSeededFrom] = useState<typeof data>(null)
  if (data && data !== seededFrom) {
    setSeededFrom(data)
    const text = data.instructions ?? ""
    setValue(text)
    setBaseline(text)
  }

  const dirty = value !== baseline

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await agentInstructionsService.save({ instructions: value })
      setBaseline(saved.instructions ?? "")
      toast.success("Agent instructions saved.")
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to save agent instructions.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agent Instructions
          </h1>
          <p className="text-muted-foreground">
            Custom rules the AI follows when writing your outreach emails: banned
            words, phrasings to avoid, tone preferences, and anything else it
            should always or never do.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving || loading}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={false}
        emptyMessage=""
        onRetry={refetch}
        skeletonRows={8}
      >
        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                "e.g.\n" +
                "- Never use the words “synergy”, “revolutionary”, or “game-changer”.\n" +
                "- Don't open with a question.\n" +
                "- Avoid exclamation marks.\n" +
                "- Keep sentences short and plain."
              }
              className="min-h-[60vh] resize-y text-sm"
            />
          </CardContent>
        </Card>
      </DataState>
    </div>
  )
}
