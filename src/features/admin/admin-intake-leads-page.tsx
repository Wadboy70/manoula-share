import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminMotherLead, AdminProfessionalLead } from '@/features/admin/admin.types'
import {
  formatDeliveryModes,
  formatMotherSpecialtyLabels,
  formatPersonName,
  formatProfessionalSpecialtyLabels,
  formatSubmittedAt,
  truncateCell,
} from '@/features/admin/admin-format'
import { useAdminIntakeLeads } from '@/features/admin/use-admin-intake-leads'

type AdminIntakeLeadsTableProps = {
  mothers: AdminMotherLead[]
  professionals: AdminProfessionalLead[]
}

export function AdminIntakeLeadsTables({ mothers, professionals }: AdminIntakeLeadsTableProps) {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="admin-mothers-heading">
        <h2 id="admin-mothers-heading" className="font-heading mb-4 text-xl text-white">
          Mothers
        </h2>
        {mothers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No mother intake submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead className="min-w-[12rem] whitespace-normal">Looking for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mothers.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{formatSubmittedAt(lead.intake_submitted_at)}</TableCell>
                  <TableCell>{formatPersonName(lead.first_name, lead.last_name)}</TableCell>
                  <TableCell>{lead.email ?? '—'}</TableCell>
                  <TableCell>{lead.lead_status ?? '—'}</TableCell>
                  <TableCell>{lead.location_label ?? '—'}</TableCell>
                  <TableCell>{formatMotherSpecialtyLabels(lead.specialty_labels)}</TableCell>
                  <TableCell
                    className="max-w-xs whitespace-normal"
                    title={lead.looking_for_details ?? undefined}
                  >
                    {truncateCell(lead.looking_for_details, 120)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section aria-labelledby="admin-professionals-heading">
        <h2 id="admin-professionals-heading" className="font-heading mb-4 text-xl text-white">
          Professionals
        </h2>
        {professionals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No professional intake submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Issuing body</TableHead>
                <TableHead>Registration #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{formatSubmittedAt(lead.intake_submitted_at)}</TableCell>
                  <TableCell>{formatPersonName(lead.first_name, lead.last_name)}</TableCell>
                  <TableCell>{lead.email ?? '—'}</TableCell>
                  <TableCell>{lead.lead_status ?? '—'}</TableCell>
                  <TableCell>{lead.location_label ?? '—'}</TableCell>
                  <TableCell>{formatProfessionalSpecialtyLabels(lead.specialty_labels)}</TableCell>
                  <TableCell>{formatDeliveryModes(lead)}</TableCell>
                  <TableCell>{lead.credential_type ?? '—'}</TableCell>
                  <TableCell>{lead.issuing_body ?? '—'}</TableCell>
                  <TableCell>{lead.registration_number ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

type AdminIntakeLeadsPageShellProps = {
  loading: boolean
  error: string | null
  mothers: AdminMotherLead[]
  professionals: AdminProfessionalLead[]
  onRetry: () => void
}

export function AdminIntakeLeadsPageShell({
  loading,
  error,
  mothers,
  professionals,
  onRetry,
}: AdminIntakeLeadsPageShellProps) {
  return (
    <div className="bg-background font-body mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl text-white md:text-3xl">Intake leads</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Prelaunch form submissions from mothers and professionals.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading intake leads…</p>
      ) : error ? (
        <div className="flex flex-col gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <AdminIntakeLeadsTables mothers={mothers} professionals={professionals} />
      )}
    </div>
  )
}

export function AdminIntakeLeadsPage() {
  const { data, loading, error, reload } = useAdminIntakeLeads()

  return (
    <AdminIntakeLeadsPageShell
      loading={loading}
      error={error}
      mothers={data?.mothers ?? []}
      professionals={data?.professionals ?? []}
      onRetry={() => {
        void reload()
      }}
    />
  )
}
