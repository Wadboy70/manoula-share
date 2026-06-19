import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchAdminIntakeLeads } from '@/features/admin/admin.service'

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: rpcMock,
  },
}))

describe('fetchAdminIntakeLeads', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('parses mothers and professionals from a successful RPC response', async () => {
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        mothers: [
          {
            id: 1,
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            lead_status: 'prelaunch',
            intake_submitted_at: '2026-06-20T10:00:00.000Z',
            location_label: 'London, UK',
            specialty_labels: ['Lactation support'],
            looking_for_details: 'Evening support',
          },
        ],
        professionals: [
          {
            id: 2,
            first_name: 'Sam',
            last_name: 'Pro',
            email: 'sam@example.com',
            lead_status: 'prelaunch',
            intake_submitted_at: '2026-06-20T11:00:00.000Z',
            location_label: 'Manchester, UK',
            specialty_labels: ['Doula care'],
            offers_remote: true,
            offers_in_home: false,
            offers_provider_location: false,
            credential_type: 'IBCLC',
            issuing_body: 'Example Board',
            registration_number: '12345',
          },
        ],
      },
      error: null,
    })

    const result = await fetchAdminIntakeLeads()

    expect(result).toEqual({
      ok: true,
      data: {
        mothers: [
          expect.objectContaining({
            id: 1,
            email: 'jane@example.com',
            specialty_labels: ['Lactation support'],
          }),
        ],
        professionals: [
          expect.objectContaining({
            id: 2,
            email: 'sam@example.com',
            offers_remote: true,
          }),
        ],
      },
    })
    expect(rpcMock).toHaveBeenCalledWith('list_admin_intake_leads')
  })

  it('returns forbidden error from RPC body', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, error: 'Forbidden' },
      error: null,
    })

    const result = await fetchAdminIntakeLeads()
    expect(result).toEqual({ ok: false, error: 'Forbidden' })
  })

  it('returns transport error from supabase client', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    })

    const result = await fetchAdminIntakeLeads()
    expect(result).toEqual({ ok: false, error: 'Network error' })
  })
})
