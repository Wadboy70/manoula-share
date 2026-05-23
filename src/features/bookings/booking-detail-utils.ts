import {
  DELIVERY_MODE_LABELS,
  type DeliveryMode,
} from '@/features/search/delivery-mode-filter'

import { bookingStatusLabel } from './booking-status'
import type { BookingDetailRow } from './booking.types'

type LocationService = NonNullable<BookingDetailRow['services']>

function deliveryLabel(mode: string): string {
  if (mode in DELIVERY_MODE_LABELS) {
    return DELIVERY_MODE_LABELS[mode as DeliveryMode]
  }
  return mode
}

function professionalLocationLabel(
  profiles: BookingDetailRow['professional']['professional_search_profiles'],
): string | null {
  if (!profiles) return null
  const row = Array.isArray(profiles) ? profiles[0] : profiles
  return row?.location_label?.trim() || null
}

export function bookingLocationLines(
  service: LocationService | null,
  professionalProfiles: BookingDetailRow['professional']['professional_search_profiles'],
): string[] {
  if (!service) return []

  const lines: string[] = []
  const mode = service.delivery_mode

  if (mode === 'remote') {
    lines.push(
      service.remote_scope === 'country'
        ? 'Available remotely within the provider’s country'
        : 'Available remotely',
    )
  }

  if (mode === 'provider_location') {
    if (service.provider_location_name?.trim()) {
      lines.push(service.provider_location_name.trim())
    }
    for (const loc of service.service_provider_locations ?? []) {
      const label = loc.location_label?.trim() || loc.location_name?.trim()
      if (label) lines.push(label)
    }
  }

  if (mode === 'in_home') {
    if (service.service_area_text?.trim()) {
      lines.push(`Service area: ${service.service_area_text.trim()}`)
    } else if (service.service_radius_km != null) {
      lines.push(`Travels within ${service.service_radius_km} km`)
    }
    for (const place of service.service_area_places ?? []) {
      const label = place.location_label?.trim()
      if (label) lines.push(label)
    }
  }

  const base = professionalLocationLabel(professionalProfiles)
  if (base && mode !== 'remote') {
    lines.push(`Provider based in ${base}`)
  }

  return [...new Set(lines)]
}

export function formatBookingPrice(
  priceCents: number | null,
  currencyCode: string | null,
): string {
  if (priceCents == null) return 'Price on request'
  const currency = currencyCode?.trim() || 'GBP'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(priceCents / 100)
}

export function formatBookingDuration(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (remainder === 0) return `${hours} hr`
  return `${hours} hr ${remainder} min`
}

export function formatBookingTimestamp(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export type BookingDetailSection = { label: string; value: string }

export function buildBookingDetailSections(
  booking: BookingDetailRow,
  role: 'professional' | 'client',
): BookingDetailSection[] {
  const service = booking.services
  const counterparty =
    role === 'professional'
      ? [booking.client.first_name, booking.client.last_name].filter(Boolean).join(' ') || 'Client'
      : [booking.professional.first_name, booking.professional.last_name].filter(Boolean).join(' ') ||
        'Provider'

  const sections: BookingDetailSection[] = [
    { label: 'Status', value: bookingStatusLabel(booking.status) },
    { label: role === 'professional' ? 'Client' : 'Provider', value: counterparty },
  ]

  if (service) {
    sections.push({ label: 'Service', value: service.title })
    sections.push({ label: 'Delivery', value: deliveryLabel(service.delivery_mode) })

    const locations = bookingLocationLines(service, booking.professional.professional_search_profiles)
    if (locations.length > 0) {
      sections.push({ label: 'Location', value: locations.join(' · ') })
    }

    const duration = formatBookingDuration(service.duration_minutes)
    if (duration) sections.push({ label: 'Duration', value: duration })

    sections.push({
      label: 'Price',
      value: formatBookingPrice(service.price_cents, service.currency_code),
    })

    if (service.description?.trim()) {
      sections.push({ label: 'About this service', value: service.description.trim() })
    }
  }

  const requested = formatBookingTimestamp(booking.created_at)
  if (requested) sections.push({ label: 'Requested', value: requested })

  const updated = formatBookingTimestamp(booking.updated_at)
  if (updated && updated !== requested) {
    sections.push({ label: 'Last updated', value: updated })
  }

  const scheduled = formatBookingTimestamp(booking.scheduled_at)
  if (scheduled) sections.push({ label: 'Scheduled', value: scheduled })

  return sections
}
