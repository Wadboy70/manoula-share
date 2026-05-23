import { describe, expect, it } from 'vitest'

import { parseSearchParam } from '@/lib/search-params'

import { bookingIdParam, bookingsPath } from './booking-routes'

describe('booking-routes', () => {
  it('builds client and professional paths', () => {
    expect(bookingsPath('client')).toBe('/bookings')
    expect(bookingsPath('client', 12)).toBe(`/bookings?${bookingIdParam.key}=12`)
    expect(bookingsPath('professional', 3)).toBe(`/dashboard/bookings?${bookingIdParam.key}=3`)
  })

  it('parses booking id param via shared codec', () => {
    expect(parseSearchParam(bookingIdParam, '5')).toBe(5)
    expect(parseSearchParam(bookingIdParam, '')).toBeNull()
    expect(parseSearchParam(bookingIdParam, 'abc')).toBeNull()
  })
})
