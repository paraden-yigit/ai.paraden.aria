import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type { DateRange } from "@/lib/dateRanges"
import type {
  CampaignPerformance,
  CompanyDomains,
  CompanyListParams,
  OutreachCompany,
  OutreachDraft,
  OutreachEmail,
  OutreachImport,
  OutreachImportResult,
  OutreachLaunchResult,
  OutreachProspect,
  OutreachRun,
  OutreachRunCreate,
  OutreachRunSettings,
  OutreachRunUpdate,
  ProspectListParams,
  ProspectsFound,
  Selection,
} from "@/types/outreach"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Outreach runs — the campaign setup flow.
 *
 * The API scopes every call to the session's client, so there is no client id to
 * pass. Methods are `this`-free so they can be handed straight to a hook.
 *
 * Two calls start background work and return immediately: `startDraft` and
 * `compose`. Both are polled through `get`/`getDraft` rather than awaited —
 * writing a sequence takes tens of seconds per prospect.
 */
export const outreachService = {
  async list(params: PaginationParams = {}): Promise<ListResult<OutreachRun>> {
    const data = await apiClient.get<unknown>(
      `/api/outreach-runs${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<OutreachRun>(data)
  },

  get(id: number): Promise<OutreachRun> {
    return apiClient.get<OutreachRun>(`/api/outreach-runs/${id}`)
  },

  /**
   * Everyone every campaign picked up over `range`, day by day and campaign by
   * campaign — the dashboard's two cards, in one request so they cannot
   * disagree.
   */
  prospectsFound(range: DateRange): Promise<ProspectsFound> {
    return apiClient.get<ProspectsFound>(
      `/api/outreach-runs/prospects-found${buildQuery({
        start: range.from,
        end: range.to,
      })}`,
    )
  },

  create(payload: OutreachRunCreate): Promise<OutreachRun> {
    return apiClient.post<OutreachRun>("/api/outreach-runs/new", payload)
  },

  update(id: number, payload: OutreachRunUpdate): Promise<OutreachRun> {
    return apiClient.patch<OutreachRun>(`/api/outreach-runs/${id}`, payload)
  },

  remove(id: number): Promise<null> {
    return apiClient.delete<null>(`/api/outreach-runs/${id}`)
  },

  // --- the list ------------------------------------------------------------

  /** Store the Strategic run's company domains — the whole list, not a delta. */
  saveCompanyDomains(id: number, domains: string[]): Promise<CompanyDomains> {
    return apiClient.put<CompanyDomains>(`/api/outreach-runs/${id}/companies`, {
      domains,
    })
  },

  /** Change the two settings a campaign owner may change while it is going. */
  updateSettings(id: number, payload: OutreachRunSettings): Promise<OutreachRun> {
    return apiClient.patch<OutreachRun>(
      `/api/outreach-runs/${id}/settings`,
      payload,
    )
  },

  /** Stop a running campaign. Nothing is unpicked; resuming continues it. */
  pause(id: number): Promise<OutreachRun> {
    return apiClient.post<OutreachRun>(`/api/outreach-runs/${id}/pause`)
  },

  resume(id: number): Promise<OutreachRun> {
    return apiClient.post<OutreachRun>(`/api/outreach-runs/${id}/resume`)
  },

  /** What the campaign actually sent, and what came back, day by day. */
  performance(id: number, range: DateRange): Promise<CampaignPerformance> {
    return apiClient.get<CampaignPerformance>(
      `/api/outreach-runs/${id}/performance${buildQuery({
        start: range.from,
        end: range.to,
      })}`,
    )
  },

  /** Start a Flow campaign running, from now. */
  start(id: number): Promise<OutreachRun> {
    return apiClient.post<OutreachRun>(`/api/outreach-runs/${id}/start`)
  },

  /** One page of the campaign's companies — the search and the order are the API's. */
  async listCompanies(
    id: number,
    params: CompanyListParams = {},
  ): Promise<ListResult<OutreachCompany>> {
    const data = await apiClient.get<unknown>(
      `/api/outreach-runs/${id}/companies${buildQuery({
        skip: params.skip,
        limit: params.limit,
        q: params.q,
      })}`,
    )
    return normalizeList<OutreachCompany>(data)
  },

  /**
   * Every uploaded domain on the campaign.
   *
   * What anyone sending the whole list back has to read first: `listCompanies`
   * is one page of two kinds of company, and writing that back would both drop
   * the pages it never saw and turn discovered employers into uploaded ones.
   */
  getCompanyDomains(id: number): Promise<CompanyDomains> {
    return apiClient.get<CompanyDomains>(
      `/api/outreach-runs/${id}/company-domains`,
    )
  },

  importProspects(
    id: number,
    payload: OutreachImport,
  ): Promise<OutreachImportResult> {
    return apiClient.post<OutreachImportResult>(
      `/api/outreach-runs/${id}/prospects`,
      payload,
    )
  },

  /** One page of the campaign's people — the search and the order are the API's. */
  async listProspects(
    id: number,
    params: ProspectListParams = {},
  ): Promise<ListResult<OutreachProspect>> {
    const data = await apiClient.get<unknown>(
      `/api/outreach-runs/${id}/prospects${buildQuery({
        skip: params.skip,
        limit: params.limit,
        q: params.q,
        added_from: params.added_from,
        added_to: params.added_to,
        sort: params.sort,
        direction: params.direction,
      })}`,
    )
    return normalizeList<OutreachProspect>(data)
  },

  removeProspect(id: number, prospectId: number): Promise<null> {
    return apiClient.delete<null>(
      `/api/outreach-runs/${id}/prospects/${prospectId}`,
    )
  },

  // --- phase one: three approaches per step --------------------------------

  /** Kicks off writing in the background; poll `getDraft` for the result. */
  /** Start writing the approaches. `prospectIndex` walks the candidate order —
   * what "try another prospect" asks for; omitted writes against the fullest
   * record. */
  startDraft(id: number, prospectIndex?: number): Promise<OutreachDraft> {
    return apiClient.post<OutreachDraft>(`/api/outreach-runs/${id}/draft`, {
      prospect_index: prospectIndex ?? null,
    })
  },

  getDraft(id: number): Promise<OutreachDraft> {
    return apiClient.get<OutreachDraft>(`/api/outreach-runs/${id}/draft`)
  },

  saveSelections(
    id: number,
    selections: {
      step_index: number
      approach?: string | null
      subject?: string | null
      body: string
    }[],
  ): Promise<Selection[]> {
    return apiClient.post<Selection[]>(
      `/api/outreach-runs/${id}/selections`,
      { selections },
    )
  },

  getSelections(id: number): Promise<Selection[]> {
    return apiClient.get<Selection[]>(`/api/outreach-runs/${id}/selections`)
  },

  // --- phase two, and launch -----------------------------------------------

  /** Personalises the chosen approach for everyone; poll `get` for status. */
  compose(id: number): Promise<OutreachRun> {
    return apiClient.post<OutreachRun>(`/api/outreach-runs/${id}/compose`)
  },

  listEmails(id: number, prospectId: number): Promise<OutreachEmail[]> {
    return apiClient.get<OutreachEmail[]>(
      `/api/outreach-runs/${id}/prospects/${prospectId}/emails`,
    )
  },

  /** Materialises into the sending queue. Nothing leaves until the dispatcher runs. */
  launch(id: number): Promise<OutreachLaunchResult> {
    return apiClient.post<OutreachLaunchResult>(
      `/api/outreach-runs/${id}/launch`,
    )
  },
}
