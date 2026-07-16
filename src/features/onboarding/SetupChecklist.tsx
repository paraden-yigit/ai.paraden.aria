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
import type { SetupState } from "@/features/onboarding/useSetupState"

interface StepDef {
  title: string
  blurb: string
  to: string
  done: boolean
}

/**
 * The first-run path: four steps from empty account to first campaign, shown
 * until all four are done. Deliberately calm: any order works, nothing can
 * break, everything stays editable.
 */
export function SetupChecklist({ state }: { state: SetupState }) {
  if (state.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Get set up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  const steps: StepDef[] = [
    {
      title: "Tell ARIA about your company",
      blurb: "What you do, your positioning, your competitors. It shapes every email.",
      to: "/company",
      done: state.messagingDone,
    },
    {
      title: "Add a product",
      blurb: "What you sell, in a few short answers. Supporting files help too.",
      to: "/products",
      done: state.productDone,
    },
    {
      title: "Generate your targeting profile",
      blurb: "ARIA works out which companies and people to look for.",
      to:
        state.firstProductId != null
          ? `/products/${state.firstProductId}?tab=icp`
          : "/products",
      done: state.targetingDone,
    },
    {
      title: "Create your first campaign",
      blurb: "ARIA finds prospects and drafts the emails. You approve everything.",
      to: "/campaigns/new",
      done: state.campaignDone,
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get set up</CardTitle>
        <CardDescription>
          {doneCount} of {steps.length} done. Take the steps in any order:
          nothing here can break, and everything can be changed later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          {steps.map((step) => (
            <li key={step.title}>
              <Link
                to={step.to}
                className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      step.done
                        ? "font-medium text-muted-foreground line-through decoration-muted-foreground/50"
                        : "font-medium"
                    }
                  >
                    {step.title}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {step.blurb}
                  </span>
                </span>
                {!step.done && (
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
