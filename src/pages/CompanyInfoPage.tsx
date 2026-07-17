import { useCallback, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataState } from "@/components/DataState"
import { DescriptionList } from "@/components/DescriptionList"
import { CompanyLogoCard } from "@/features/company-profile/CompanyLogoCard"
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
        <h1 className="text-2xl font-semibold tracking-tight">Company info</h1>
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
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
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
                  <Tabs defaultValue="details" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="details">Company details</TabsTrigger>
                      <TabsTrigger value="messaging">Messaging</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                      <DescriptionList
                        items={[
                          { label: "Name", value: client.name },
                          { label: "Country", value: client.country },
                          { label: "URL", value: client.url },
                        ]}
                      />
                    </TabsContent>

                    <TabsContent value="messaging">
                      <DescriptionList
                        items={[
                          {
                            label: "What does your company do?",
                            value: client.value_proposition,
                          },
                          {
                            label: "Market positioning / USP",
                            value: client.market_positioning,
                          },
                          { label: "Competitors", value: client.competitors },
                        ]}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
            <CompanyLogoCard />
          </div>
        )}
      </DataState>
    </div>
  )
}
