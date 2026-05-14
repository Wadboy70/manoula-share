export type LocationSuggestion = {
  id: string
  label: string
  placeId: string
  latitude: number
  longitude: number
  countryCode: string
  /** Parent Geoapify place ids (e.g. city) for containment vs stored coverage rows. */
  ancestorPlaceIds: string[]
}

export type LocationSuggestionsPayload = {
  suggestions: LocationSuggestion[]
}
