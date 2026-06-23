import { buildQuery } from "@/lib/query"
import type { ListResult, PaginationParams } from "@/types/api"
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactWithCompany,
} from "@/types/contact"
import { apiClient } from "./http"
import { normalizeList } from "./normalizeList"

/**
 * Contacts service — wraps the company-scoped /api/companies/{id}/contacts
 * endpoints. The API scopes every call to the session's client via the parent
 * company, so there's no client_id to pass.
 */
export const contactService = {
  /** All of the client's contacts, across every company. */
  async listAll(
    params: PaginationParams = {},
  ): Promise<ListResult<ContactWithCompany>> {
    const data = await apiClient.get<unknown>(
      `/api/contacts${buildQuery({ skip: params.skip, limit: params.limit })}`,
    )
    return normalizeList<ContactWithCompany>(data)
  },

  async list(
    companyId: number,
    params: PaginationParams = {},
  ): Promise<ListResult<Contact>> {
    const data = await apiClient.get<unknown>(
      `/api/companies/${companyId}/contacts${buildQuery({
        skip: params.skip,
        limit: params.limit,
      })}`,
    )
    return normalizeList<Contact>(data)
  },

  /** Find the company's people via FullEnrich; returns how many were found. */
  find(companyId: number): Promise<{ found: number }> {
    return apiClient.post<{ found: number }>(
      `/api/companies/${companyId}/contacts/find`,
    )
  },

  get(companyId: number, contactId: number): Promise<Contact> {
    return apiClient.get<Contact>(
      `/api/companies/${companyId}/contacts/${contactId}`,
    )
  },

  create(companyId: number, payload: ContactCreate): Promise<Contact> {
    return apiClient.post<Contact>(
      `/api/companies/${companyId}/contacts/new`,
      payload,
    )
  },

  update(
    companyId: number,
    contactId: number,
    payload: ContactUpdate,
  ): Promise<Contact> {
    return apiClient.patch<Contact>(
      `/api/companies/${companyId}/contacts/${contactId}`,
      payload,
    )
  },

  remove(companyId: number, contactId: number): Promise<unknown> {
    return apiClient.delete(`/api/companies/${companyId}/contacts/${contactId}`)
  },

  /** Start an async FullEnrich work-email enrichment; returns the job id. */
  startEnrich(
    companyId: number,
    contactId: number,
  ): Promise<{ enrichment_id: string }> {
    return apiClient.post<{ enrichment_id: string }>(
      `/api/companies/${companyId}/contacts/${contactId}/enrich`,
    )
  },

  /** Poll an enrichment; once FINISHED the returned contact has its email set. */
  pollEnrich(
    companyId: number,
    contactId: number,
    enrichmentId: string,
  ): Promise<{ status: string; contact: Contact }> {
    return apiClient.post<{ status: string; contact: Contact }>(
      `/api/companies/${companyId}/contacts/${contactId}/enrich/${enrichmentId}`,
    )
  },
}
