import type { EmailToneTemplate } from "@/types/emailToneTemplate"
import { apiClient } from "./http"

/**
 * Email tone templates — the admin-curated set of reusable tone templates a
 * user can pick from on their email settings page. Read-only for end users; the
 * list is global (not client-scoped). Methods are `this`-free so they can be
 * passed as references.
 */
export const emailToneTemplateService = {
  /** All email tone templates offered in the settings picker. */
  list(): Promise<EmailToneTemplate[]> {
    return apiClient.get<EmailToneTemplate[]>("/api/email-tone-templates")
  },
}
