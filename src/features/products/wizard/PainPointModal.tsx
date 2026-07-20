import { useEffect, useState } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import type { PainPointInput } from "@/types/product"

interface PainPointModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prefilled values when editing an existing pain point (add otherwise). */
  initial?: PainPointInput | null
  onSave: (value: PainPointInput) => void
}

const EMPTY: PainPointInput = {
  name: "",
  challenge: "",
  why_it_matters: "",
  how_it_helps: "",
}

/**
 * Modal form for one pain point: the challenge the prospect faces, why it
 * matters to them, and how the product helps. All three are required. Used in
 * the wizard (add) and on the product detail page.
 */
export function PainPointModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: PainPointModalProps) {
  const [value, setValue] = useState<PainPointInput>(EMPTY)

  // Reset the form to the initial values each time the modal opens.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setValue(initial ?? EMPTY)
  }, [open, initial])

  const valid =
    value.name.trim() !== "" &&
    value.challenge.trim() !== "" &&
    value.why_it_matters.trim() !== "" &&
    value.how_it_helps.trim() !== ""

  function handleSave() {
    if (!valid) return
    onSave({
      name: value.name.trim(),
      challenge: value.challenge.trim(),
      why_it_matters: value.why_it_matters.trim(),
      how_it_helps: value.how_it_helps.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit pain point" : "Add a pain point"}</DialogTitle>
          <DialogDescription>
            Describe the challenge, why it matters, and how your product helps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pp-name">Name this pain point</Label>
            <Input
              id="pp-name"
              value={value.name}
              onChange={(e) =>
                setValue((v) => ({ ...v, name: e.target.value }))
              }
              maxLength={255}
              placeholder="e.g. Slow onboarding"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-challenge">
              What challenge is the prospect facing?
            </Label>
            <Textarea
              id="pp-challenge"
              rows={3}
              value={value.challenge}
              onChange={(e) =>
                setValue((v) => ({ ...v, challenge: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-why">Why does this matter to them?</Label>
            <Textarea
              id="pp-why"
              rows={3}
              value={value.why_it_matters}
              onChange={(e) =>
                setValue((v) => ({ ...v, why_it_matters: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-how">How does this product help?</Label>
            <Textarea
              id="pp-how"
              rows={3}
              value={value.how_it_helps}
              onChange={(e) =>
                setValue((v) => ({ ...v, how_it_helps: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!valid}>
            Save pain point
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
