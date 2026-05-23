import { describe, expect, it } from 'vitest'

import {
  bookingLocationLines,
  buildBookingDetailSections,
  formatBookingPrice,
} from './booking-detail-utils'
import type { BookingDetailRow } from './booking.types'

function detailRow(
  partial: Partial<BookingDetailRow> & Pick<BookingDetailRow, 'id' | 'status'>,
): BookingDetailRow {
  return {
    client_id: 1,
    professional_id: 2,
    service_id: 10,
    created_at: '2026-05-01T10:00:00.000Z',
    updated_at: '2026-05-02T10:00:00.000Z',
    scheduled_at: null,
    client: { id: 1, first_name: 'Alex', last_name: 'M', profile_photo_url: null },
    professional: {
      id: 2,
      first_name: 'Sam',
      last_name: 'Pro',
      profile_photo_url: null,
      professional_search_profiles: { location_label: 'London, UK' },
    },
    services: {
      id: 10,
      title: 'Home visit',
      description: 'Support at your home.',
      delivery_mode: 'in_home',
      remote_scope: null,
      provider_location_name: null,
      service_area_type: 'radius',
      service_area_text: 'Greater London',
      service_radius_km: 25,
      duration_minutes: 60,
      price_cents: 12000,
      currency_code: 'GBP',
      service_provider_locations: [],
      service_area_places: [{ location_label: 'Zones 1–3' }],
    },
    conversations: { id: 5 },
    ...partial,
  }
}

describe('bookingLocationLines', () => {
  it('summarizes in-home service area and provider base', () => {
    const row = detailRow({ id: 1, status: 'pending' })
    const lines = bookingLocationLines(row.services, row.professional.professional_search_profiles)
    expect(lines).toContain('Service area: Greater London')
    expect(lines).toContain('Zones 1–3')
    expect(lines).toContain('Provider based in London, UK')
  })
})

describe('formatBookingPrice', () => {
  it('formats currency amounts', () => {
    expect(formatBookingPrice(12000, 'GBP')).toMatch(/120/)
  })
})

describe('buildBookingDetailSections', () => {
  it('includes service and location fields', () => {
    const sections = buildBookingDetailSections(detailRow({ id: 1, status: 'pending' }), 'client')
    const labels = sections.map((s) => s.label)
    expect(labels).toContain('Location')
    expect(labels).toContain('Duration')
    expect(labels).toContain('About this service')
  })
})
