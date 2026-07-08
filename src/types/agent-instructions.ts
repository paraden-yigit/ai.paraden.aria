/**
 * A client's custom instructions for the outreach AI agent, as returned by
 * `GET /api/agent-instructions`. Free-form guidance (banned words, patterns to
 * avoid, tone rules) the agent follows for this client's emails. Client-scoped,
 * one record per client.
 */
export interface AgentInstructions {
  id: number
  client_id: number
  instructions: string | null
  created_at: string
  updated_at: string
}

/** Body for `PUT /api/agent-instructions`. */
export interface AgentInstructionsUpdate {
  instructions?: string | null
}
