import { useCallback } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Circle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync } from "@/hooks/useAsync"
import { agentInstructionsService } from "@/services/agent-instructions.service"
import type { SetupState } from "@/features/onboarding/useSetupState"

/** How ARIA has been taught so far. Three signals ride along from the setup
 * state; agent instructions get their own cheap probe. */
export function KnowledgeMeter({ setup }: { setup: SetupState }) {
  const fetcher = useCallback(() => agentInstructionsService.get(), [])
  const instructions = useAsync(fetcher, [])

  if (setup.loading || instructions.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ARIA's knowledge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  const signals = [
    {
      label: "Company messaging",
      hint: "What you do and how you stand out.",
      to: "/company",
      done: setup.messagingDone,
    },
    {
      label: "Product brief",
      hint: "What you sell and to whom.",
      to: "/products",
      done: setup.productDone,
    },
    {
      label: "Targeting profile",
      hint: "Who ARIA looks for.",
      to:
        setup.firstProductId != null
          ? `/products/${setup.firstProductId}?tab=icp`
          : "/products",
      done: setup.targetingDone,
    },
    {
      label: "Agent instructions",
      hint: "Extra guidance for how ARIA writes.",
      to: "/company/agent-instructions",
      done: !instructions.error && !!instructions.data?.instructions?.trim(),
    },
  ]
  const doneCount = signals.filter((s) => s.done).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>ARIA's knowledge</CardTitle>
        <CardDescription>
          The more you teach ARIA, the sharper every email gets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={signals.length}
          aria-valuenow={doneCount}
          aria-label={`${doneCount} of ${signals.length} knowledge areas filled in`}
          className="flex gap-1"
        >
          {signals.map((signal) => (
            <span
              key={signal.label}
              className={
                signal.done
                  ? "h-1.5 flex-1 rounded-full bg-primary"
                  : "h-1.5 flex-1 rounded-full bg-muted"
              }
            />
          ))}
        </div>
        <ul className="space-y-1">
          {signals.map((signal) => (
            <li key={signal.label}>
              <Link
                to={signal.to}
                className="group flex items-center gap-2.5 rounded-md p-1.5 text-sm transition-colors hover:bg-accent"
              >
                {signal.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{signal.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {signal.hint}
                  </span>
                </span>
                {!signal.done && (
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
