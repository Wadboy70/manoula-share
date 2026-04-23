export type LocationSuggestion = {
  id: string
  label: string
  mapboxId: string
  latitude: number
  longitude: number
  /** Parent place ids from Mapbox `properties.context` (user narrower than stored coverage). */
  ancestorMapboxIds: string[]
}

export type LocationSuggestionsPayload = {
  suggestions: LocationSuggestion[]
}
