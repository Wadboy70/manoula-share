import { SOMETHING_ELSE_SPECIALTY_LABEL } from '@/features/professionals/specialty-search-picker'

export function formatPersonName(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName, lastName].filter((part) => part && part.trim().length > 0)
  return parts.length > 0 ? parts.join(' ') : '—'
}

export function formatSubmittedAt(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatMotherSpecialtyLabels(labels: string[]): string {
  if (labels.length === 0) return SOMETHING_ELSE_SPECIALTY_LABEL
  return labels.join(', ')
}

export function formatProfessionalSpecialtyLabels(labels: string[]): string {
  if (labels.length === 0) return '—'
  return labels.join(', ')
}

export function formatDeliveryModes(lead: {
  offers_remote: boolean
  offers_in_home: boolean
  offers_provider_location: boolean
}): string {
  const modes: string[] = []
  if (lead.offers_remote) modes.push('Remote')
  if (lead.offers_in_home) modes.push('In-home')
  if (lead.offers_provider_location) modes.push('Provider location')
  return modes.length > 0 ? modes.join(', ') : '—'
}

export function truncateCell(value: string | null, maxLength = 80): string {
  if (!value || value.trim().length === 0) return '—'
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…`
}
