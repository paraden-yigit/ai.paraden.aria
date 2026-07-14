/**
 * Permission keys granted by a user's role (mirrors the API permission
 * catalog). A page is shown / an action allowed only when the user's role
 * grants the matching permission — the check is permission-driven, never based
 * on the role name.
 */
export const PERMISSIONS = {
  companyInfo: "company_info",
  exclusionLists: "exclusion_lists",
  agentInstructions: "agent_instructions",
  teams: "teams",
  usersView: "users_view",
  usersViewAll: "users_view_all",
  usersManage: "users_manage",
  productsManage: "products_manage",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
