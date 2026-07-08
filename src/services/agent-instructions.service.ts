import type {
  AgentInstructions,
  AgentInstructionsUpdate,
} from "@/types/agent-instructions"
import { apiClient } from "./http"

/**
 * Agent-instructions service — the authenticated client's custom instructions
 * for the outreach AI agent. The API scopes both calls to the session's client,
 * so there's no id to pass. Methods are `this`-free so they can be passed as
 * references.
 */
export const agentInstructionsService = {
  /** The current client's agent instructions (created empty on first read). */
  get(): Promise<AgentInstructions> {
    return apiClient.get<AgentInstructions>("/api/agent-instructions")
  },

  /** Save the current client's agent instructions. */
  save(payload: AgentInstructionsUpdate): Promise<AgentInstructions> {
    return apiClient.put<AgentInstructions>("/api/agent-instructions", payload)
  },
}
