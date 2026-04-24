/** Matches `public.services.delivery_mode` CHECK constraint. */
export const DELIVERY_MODES = ['remote', 'in_home', 'provider_location'] as const

export type DeliveryMode = (typeof DELIVERY_MODES)[number]

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  remote: 'Remote',
  in_home: 'In-home',
  provider_location: 'Provider location',
}

export type DeliveryModeFilterValue = '' | DeliveryMode
