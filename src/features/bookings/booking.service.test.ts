import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  acceptBooking,
  declineBooking,
  completeBooking,
  fetchBookingsForUser,
} from './booking.service'

const rpcMock = vi.hoisted(() => vi.fn())
const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}))

describe('booking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchBookingsForUser queries by professional_id', async () => {
    const orderMock = vi.fn(async () => ({ data: [{ id: 1 }], error: null }))
    const inMock = vi.fn(() => ({ order: orderMock }))
    const eqMock = vi.fn(() => ({ in: inMock }))
    const selectMock = vi.fn(() => ({ eq: eqMock }))
    fromMock.mockReturnValue({ select: selectMock })

    const result = await fetchBookingsForUser('professional', 42)

    expect(fromMock).toHaveBeenCalledWith('bookings')
    expect(eqMock).toHaveBeenCalledWith('professional_id', 42)
    expect(result.data).toEqual([{ id: 1 }])
    expect(result.error).toBeNull()
  })

  it('fetchBookingsForUser returns error message', async () => {
    const orderMock = vi.fn(async () => ({ data: null, error: { message: 'db fail' } }))
    const inMock = vi.fn(() => ({ order: orderMock }))
    const eqMock = vi.fn(() => ({ in: inMock }))
    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: eqMock })) })

    const result = await fetchBookingsForUser('client', 1)

    expect(result.data).toBeNull()
    expect(result.error?.message).toBe('db fail')
  })

  it('acceptBooking calls update_booking_status rpc', async () => {
    rpcMock.mockResolvedValue({ error: null })

    const result = await acceptBooking(5)

    expect(rpcMock).toHaveBeenCalledWith('update_booking_status', {
      p_booking_id: 5,
      p_status: 'accepted',
    })
    expect(result.error).toBeNull()
  })

  it('declineBooking calls update_booking_status rpc', async () => {
    rpcMock.mockResolvedValue({ error: null })

    await declineBooking(5)

    expect(rpcMock).toHaveBeenCalledWith('update_booking_status', {
      p_booking_id: 5,
      p_status: 'declined',
    })
  })

  it('completeBooking calls update_booking_status rpc', async () => {
    rpcMock.mockResolvedValue({ error: null })

    await completeBooking(5)

    expect(rpcMock).toHaveBeenCalledWith('update_booking_status', {
      p_booking_id: 5,
      p_status: 'completed',
    })
  })
})
