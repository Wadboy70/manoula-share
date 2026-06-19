import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AdminIntakeLeadsPageShell } from '@/features/admin/admin-intake-leads-page'
import type { AdminMotherLead, AdminProfessionalLead } from '@/features/admin/admin.types'

const motherLead: AdminMotherLead = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  lead_status: 'prelaunch',
  intake_submitted_at: '2026-06-20T10:00:00.000Z',
  location_label: 'London, UK',
  specialty_labels: [],
  looking_for_details: 'Need flexible evening support.',
}

const professionalLead: AdminProfessionalLead = {
  id: 2,
  first_name: 'Sam',
  last_name: 'Pro',
  email: 'sam@example.com',
  lead_status: 'prelaunch',
  intake_submitted_at: '2026-06-20T11:00:00.000Z',
  location_label: 'Manchester, UK',
  specialty_labels: ['Doula care'],
  offers_remote: true,
  offers_in_home: true,
  offers_provider_location: false,
  credential_type: 'Doula',
  issuing_body: 'Example Board',
  registration_number: 'ABC-123',
}

describe('AdminIntakeLeadsPageShell', () => {
  it('shows loading state', () => {
    render(
      <AdminIntakeLeadsPageShell
        loading
        error={null}
        mothers={[]}
        professionals={[]}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/loading intake leads/i)).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <AdminIntakeLeadsPageShell
        loading={false}
        error="Forbidden"
        mothers={[]}
        professionals={[]}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('Forbidden')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders mother and professional rows', () => {
    render(
      <AdminIntakeLeadsPageShell
        loading={false}
        error={null}
        mothers={[motherLead]}
        professionals={[professionalLead]}
        onRetry={vi.fn()}
      />,
    )

    const mothersSection = screen.getByRole('region', { name: /mothers/i })
    expect(within(mothersSection).getByText('jane@example.com')).toBeInTheDocument()
    expect(within(mothersSection).getByText('Something else')).toBeInTheDocument()

    const professionalsSection = screen.getByRole('region', { name: /professionals/i })
    expect(within(professionalsSection).getByText('sam@example.com')).toBeInTheDocument()
    expect(within(professionalsSection).getByText('Doula care')).toBeInTheDocument()
    expect(within(professionalsSection).getByText('Remote, In-home')).toBeInTheDocument()
  })

  it('shows empty copy when there are no submissions', () => {
    render(
      <AdminIntakeLeadsPageShell
        loading={false}
        error={null}
        mothers={[]}
        professionals={[]}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/no mother intake submissions yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no professional intake submissions yet/i)).toBeInTheDocument()
  })
})
