import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { BookingList } from './booking-list'
import type { BookingListRow } from './booking.types'

function row(partial: Partial<BookingListRow> & Pick<BookingListRow, 'id' | 'status'>): BookingListRow {
  return {
    client_id: 1,
    professional_id: 2,
    service_id: 10,
    created_at: '2026-05-01T10:00:00.000Z',
    updated_at: '2026-05-02T10:00:00.000Z',
    scheduled_at: null,
    client: { id: 1, first_name: 'Alex', last_name: 'M', profile_photo_url: null },
    professional: { id: 2, first_name: 'Sam', last_name: 'Pro', profile_photo_url: null },
    services: { id: 10, title: 'Lactation visit', delivery_mode: 'remote' },
    conversations: { id: 50 },
    ...partial,
  }
}

const grouped = {
  pending: [row({ id: 1, status: 'pending' })],
  upcoming: [],
  completed: [],
}

describe('BookingList', () => {
  it('shows pending booking with professional actions', async () => {
    const onAccept = vi.fn()
    const u = userEvent.setup()

    render(
      <MemoryRouter>
        <BookingList
          role="professional"
          grouped={grouped}
          loading={false}
          error={null}
          actionBookingId={null}
          showProfessionalActions
          onRetry={() => {}}
          onAccept={onAccept}
          onDecline={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Alex M')).toBeInTheDocument()
    expect(screen.getByText('Lactation visit')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /^accept$/i }))
    expect(onAccept).toHaveBeenCalledWith(1)
  })

  it('hides accept/decline for client role', () => {
    render(
      <MemoryRouter>
        <BookingList
          role="client"
          grouped={grouped}
          loading={false}
          error={null}
          actionBookingId={null}
          onRetry={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Sam Pro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument()
  })
})
