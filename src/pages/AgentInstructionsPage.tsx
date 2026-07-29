import { useCallback, useState } from "react"
import { Bot, CheckCircle2, Lightbulb } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { agentInstructionsService } from "@/services/agent-instructions.service"
import { ApiError } from "@/services/http"

const IDEAS = [
  "Ban specific words or phrases you never want to see.",
  "Rule out openings you dislike, like starting with a question.",
  "Set limits: no exclamation marks, no buzzwords, short sentences.",
  "Name things Paraden should always mention, like a certification.",
  "Add legal or compliance wording your industry requires.",
]

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
  const ruleCount = value
    .split("\n")
    .filter((line) => line.trim() !== "").length

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Agent instructions
        </h1>
        <p className="text-muted-foreground">
          Custom rules for Paraden to follow when writing your outreach emails:
          banned words, phrasings to avoid, tone preferences, and anything else
          it should always or never do.
        </p>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={false}
        emptyMessage=""
        onRetry={refetch}
        skeletonRows={8}
      >
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <Bot className="size-5" />
                </span>
                <div>
                  <CardTitle>Your writing rules</CardTitle>
                  <CardDescription>
                    One rule per line works best. One list for your whole
                    company.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Honesty note: email generation currently reads only the
                  admin-side app-wide instructions (campaign_email_service),
                  never this client-scoped page. Remove this line when the
                  backend wires client instructions into the prompt. */}
              <p className="text-sm text-muted-foreground">
                Preview build: Paraden does not read these rules yet. Your list is
                saved for the whole company and takes effect once this page is
                wired up.
              </p>
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
                className="min-h-[50vh] resize-y text-sm"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {ruleCount > 0
                    ? `${ruleCount} ${ruleCount === 1 ? "line" : "lines"}. ${dirty ? "You have unsaved changes." : "Saved."}`
                    : dirty
                      ? "You have unsaved changes."
                      : "Nothing here yet. Add your first rule."}
                </p>
                <Button onClick={handleSave} disabled={!dirty || saving || loading}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <Lightbulb className="size-5" />
                </span>
                <div>
                  <CardTitle>What works well</CardTitle>
                  <CardDescription>
                    Rules like these will keep every email on track.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {IDEAS.map((idea) => (
                  <li key={idea} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{idea}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </DataState>
    </div>
  )
}
