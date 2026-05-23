import { describe, expect, it } from 'vitest'

import { groupBookingsByTab, resolveConversationId } from './booking-utils'
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
    services: { id: 10, title: 'Consult', delivery_mode: 'remote' },
    conversations: { id: 99 },
    ...partial,
  }
}

describe('resolveConversationId', () => {
  it('reads id from object or array', () => {
    expect(resolveConversationId({ id: 5 })).toBe(5)
    expect(resolveConversationId([{ id: 7 }])).toBe(7)
    expect(resolveConversationId(null)).toBeNull()
  })
})

describe('groupBookingsByTab', () => {
  it('groups and sorts by tab', () => {
    const grouped = groupBookingsByTab([
      row({ id: 1, status: 'completed', updated_at: '2026-05-01T00:00:00.000Z' }),
      row({ id: 2, status: 'pending', created_at: '2026-05-03T00:00:00.000Z' }),
      row({ id: 3, status: 'pending', created_at: '2026-05-04T00:00:00.000Z' }),
      row({ id: 4, status: 'accepted', updated_at: '2026-05-05T00:00:00.000Z' }),
    ])

    expect(grouped.pending.map((b) => b.id)).toEqual([3, 2])
    expect(grouped.upcoming.map((b) => b.id)).toEqual([4])
    expect(grouped.completed.map((b) => b.id)).toEqual([1])
  })
})
