/** Friction level of a CTA — how much the ask demands of the prospect. */
export type CtaFriction = "low" | "medium" | "high"

/**
 * A CTA type from the admin-curated catalog (GET /api/cta-types). Richer than the
 * 4-field {@link CtaType} stored on a campaign — it also carries id/is_system and
 * timestamps. When saving onto a campaign, send only the four shared fields.
 */
export interface CtaTypeOption {
  id: number
  type: string
  friction: CtaFriction
  intent: string
  example_closing_line: string
  is_system: boolean
  created_at: string
  updated_at: string
}
