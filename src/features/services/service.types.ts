import type { DeliveryMode } from '@/features/search/delivery-mode-filter'

export type ServiceAreaType = 'radius' | 'place_list' | 'custom_text'
export type RemoteScope = 'anywhere' | 'country'

export type ServiceProviderLocationInput = {
  id?: number
  locationName: string
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
}

export type ServiceAreaPlaceInput = {
  id?: number
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
}

export type ServiceDraft = {
  id?: number
  title: string
  description: string
  priceCents: number | null
  currencyCode: string
  durationMinutes: number | null
  specialtyId: number | null
  deliveryMode: DeliveryMode
  remoteScope: RemoteScope | null
  serviceAreaType: ServiceAreaType | null
  serviceRadiusKm: number | null
  serviceAreaText: string
  isActive: boolean
  providerLocations: ServiceProviderLocationInput[]
  serviceAreaPlaces: ServiceAreaPlaceInput[]
}

export type SpecialtyOption = {
  id: number
  label: string
}
