import { useCallback, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { DescriptionList } from "@/components/DescriptionList"
import { CompanyProfileForm } from "@/features/company-profile/CompanyProfileForm"
import { useAsync } from "@/hooks/useAsync"
import { clientService } from "@/services/client.service"
import { ApiError } from "@/services/http"
import type { ClientUpdate } from "@/types/client"

export function CompanyInfoPage() {
  const loadCompany = useCallback(() => clientService.get(), [])
  const { data: client, loading, error, refetch } = useAsync(loadCompany, [])

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(payload: ClientUpdate) {
    setSaving(true)
    try {
      await clientService.update(payload)
      toast.success("Company information updated.")
      setEditing(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update company.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company Info</h1>
        <p className="text-muted-foreground">
          View and update your company information.
        </p>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!client}
        emptyMessage="No company information found."
        onRetry={refetch}
        skeletonRows={4}
      >
        {client && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{client.name}</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <CompanyProfileForm
                  client={client}
                  onSubmit={handleSave}
                  onCancel={() => setEditing(false)}
                  submitting={saving}
                />
              ) : (
                <DescriptionList
                  items={[
                    { label: "Legal name", value: client.legal_business_name },
                    { label: "Address", value: client.address },
                    { label: "Country", value: client.country },
                    { label: "Email", value: client.email },
                    { label: "Phone", value: client.phone },
                    { label: "URL", value: client.url },
                    {
                      label: "Company reg. number",
                      value: client.company_registration_number,
                    },
                    { label: "VAT reg. number", value: client.vat_registration_number },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        )}
      </DataState>
    </div>
  )
}
