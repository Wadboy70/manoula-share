import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { fetchLocationSuggestions } from '@/features/search/location.service'
import type { LocationSuggestion } from '@/features/search/location.types'
import { fetchSearchSpecialtyOptions } from '@/features/search/specialties.service'
import type { SearchLocationFilter } from '@/features/search/search.types'
import {
  DELIVERY_MODES,
  DELIVERY_MODE_LABELS,
  type DeliveryModeFilterValue,
} from '@/features/search/delivery-mode-filter'
import { SearchProviderCard } from '@/features/search/search-provider-card'
import { useSearchResults } from '@/features/search/use-search-results'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const LOCATION_DEBOUNCE_MS = 300
const LOCATION_MIN_QUERY_LENGTH = 3

export function SearchPage() {
  const [appliedSearchLocation, setAppliedSearchLocation] = useState<SearchLocationFilter | null>(null)
  const [selectedSpecialtyLabel, setSelectedSpecialtyLabel] = useState('')
  const specialtyLabelForSearch = selectedSpecialtyLabel.trim() === '' ? null : selectedSpecialtyLabel.trim()
  const { loading, error, results, retry } = useSearchResults(
    appliedSearchLocation,
    specialtyLabelForSearch,
  )

  const [specialtyOptions, setSpecialtyOptions] = useState<{ id: number; label: string }[]>([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true)
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null)

  const [locationInput, setLocationInput] = useState('')
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuggestSuppressed, setLocationSuggestSuppressed] = useState(false)
  const locationRequestIdRef = useRef(0)
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<DeliveryModeFilterValue>('')

  useEffect(() => {
    let cancelled = false
    setSpecialtiesLoading(true)
    setSpecialtiesError(null)
    void (async () => {
      try {
        const rows = await fetchSearchSpecialtyOptions()
        if (!cancelled) {
          setSpecialtyOptions(rows.map((r) => ({ id: r.id, label: r.label })))
        }
      } catch {
        if (!cancelled) {
          setSpecialtyOptions([])
          setSpecialtiesError('Could not load specialties.')
        }
      } finally {
        if (!cancelled) {
          setSpecialtiesLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedLocationQuery(locationInput.trim())
    }, LOCATION_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
    }
  }, [locationInput])

  useEffect(() => {
    const trimmed = debouncedLocationQuery
    if (trimmed.length < LOCATION_MIN_QUERY_LENGTH) {
      setLocationSuggestions([])
      setLocationError(null)
      setLocationLoading(false)
      return
    }

    if (locationSuggestSuppressed) {
      setLocationSuggestions([])
      setLocationError(null)
      setLocationLoading(false)
      return
    }

    const requestId = ++locationRequestIdRef.current
    setLocationLoading(true)
    setLocationError(null)

    void (async () => {
      try {
        const next = await fetchLocationSuggestions(trimmed)
        if (locationRequestIdRef.current === requestId) {
          setLocationSuggestions(next)
        }
      } catch {
        if (locationRequestIdRef.current === requestId) {
          setLocationSuggestions([])
          setLocationError('Could not load location suggestions.')
        }
      } finally {
        if (locationRequestIdRef.current === requestId) {
          setLocationLoading(false)
        }
      }
    })()
  }, [debouncedLocationQuery, locationSuggestSuppressed])

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <main id="main-content" className="font-body flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <header className="mb-8 border-b border-white/10 pb-6">
            <h1 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
              Find support
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
              Discover verified maternal wellness professionals. Use filters to narrow your
              search—results will appear here as we continue building this experience.
            </p>
          </header>

          <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
            <section
              aria-labelledby="search-filters-heading"
              className="overflow-visible lg:sticky lg:top-6"
            >
              <Card className="overflow-visible">
                <CardHeader>
                  <h2
                    id="search-filters-heading"
                    className="font-heading text-base leading-snug font-medium text-card-foreground"
                  >
                    Filters
                  </h2>
                  <CardDescription>
                    Narrow by specialty and location on the server. Delivery mode filters the list below
                    only (server-side delivery filtering is coming soon).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 overflow-visible pt-0">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="search-filter-specialty"
                      className="text-sm leading-snug font-medium text-white"
                    >
                      Specialty
                    </label>
                    <div className="relative">
                      <select
                        id="search-filter-specialty"
                        value={selectedSpecialtyLabel}
                        onChange={(e) => {
                          setSelectedSpecialtyLabel(e.target.value)
                        }}
                        disabled={specialtiesLoading || specialtyOptions.length === 0}
                        className={cn(
                          'border-input bg-input/30 text-foreground h-8 w-full min-w-0 appearance-none rounded-lg border py-1 pl-2.5 pr-9 text-sm outline-none',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
                          'disabled:cursor-not-allowed disabled:opacity-60',
                        )}
                      >
                        <option value="">All specialties</option>
                        {specialtyOptions.map((opt) => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                        aria-hidden
                      />
                    </div>
                    {specialtiesLoading ? (
                      <p className="text-muted-foreground text-xs">Loading specialties…</p>
                    ) : null}
                    {specialtiesError ? (
                      <p className="text-destructive text-xs leading-relaxed">{specialtiesError}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="search-filter-location"
                      className="text-sm leading-snug font-medium text-white"
                    >
                      Location
                    </label>
                    <div className="relative overflow-visible">
                      <Input
                        id="search-filter-location"
                        type="text"
                        autoComplete="off"
                        placeholder="City or region (min. 3 characters)"
                        value={locationInput}
                        onChange={(e) => {
                          setLocationSuggestSuppressed(false)
                          const value = e.target.value
                          setLocationInput(value)
                          if (
                            appliedSearchLocation !== null &&
                            value.trim() !== (appliedSearchLocation.label ?? '').trim()
                          ) {
                            setAppliedSearchLocation(null)
                          }
                        }}
                        aria-autocomplete="list"
                        aria-expanded={locationSuggestions.length > 0}
                        aria-controls="search-location-suggestions"
                      />
                      {locationSuggestions.length > 0 ? (
                        <ul
                          id="search-location-suggestions"
                          role="listbox"
                          className="border-input absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-[#1a1a1a] py-1 shadow-lg"
                        >
                          {locationSuggestions.map((suggestion) => (
                            <li key={suggestion.id} role="presentation">
                              <button
                                type="button"
                                role="option"
                                className="hover:bg-input/50 w-full px-3 py-2 text-left text-sm text-white"
                                onClick={() => {
                                  setLocationInput(suggestion.label)
                                  setAppliedSearchLocation({
                                    mapboxId: suggestion.mapboxId,
                                    latitude: suggestion.latitude,
                                    longitude: suggestion.longitude,
                                    ancestorMapboxIds: suggestion.ancestorMapboxIds,
                                    label: suggestion.label,
                                  })
                                  setLocationSuggestions([])
                                  setLocationSuggestSuppressed(true)
                                  queueMicrotask(() => {
                                    document.getElementById('search-filter-location')?.blur()
                                  })
                                }}
                              >
                                {suggestion.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    {locationLoading ? (
                      <p className="text-muted-foreground text-xs">Searching locations…</p>
                    ) : null}
                    {locationError ? (
                      <p className="text-destructive text-xs leading-relaxed">{locationError}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="search-filter-delivery-mode"
                      className="text-sm leading-snug font-medium text-white"
                    >
                      Delivery mode
                    </label>
                    <div className="relative">
                      <select
                        id="search-filter-delivery-mode"
                        value={deliveryModeFilter}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '') {
                            setDeliveryModeFilter('')
                          } else if ((DELIVERY_MODES as readonly string[]).includes(v)) {
                            setDeliveryModeFilter(v as DeliveryModeFilterValue)
                          }
                        }}
                        className={cn(
                          'border-input bg-input/30 text-foreground h-8 w-full min-w-0 appearance-none rounded-lg border py-1 pl-2.5 pr-9 text-sm outline-none',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
                        )}
                      >
                        <option value="">All delivery modes</option>
                        {DELIVERY_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {DELIVERY_MODE_LABELS[mode]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="search-filter-availability"
                      className="text-sm leading-snug font-medium text-white"
                    >
                      Availability
                    </label>
                    <Input
                      id="search-filter-availability"
                      disabled
                      placeholder="Any time"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="search-results-heading" className="min-h-0">
              <Card className="flex h-full min-h-[280px] flex-col">
                <CardHeader>
                  <CardTitle id="search-results-heading">Results</CardTitle>
                  <CardDescription>
                    {loading
                      ? 'Loading professionals...'
                      : `Showing ${results.length} professional${results.length === 1 ? '' : 's'}.`}
                  </CardDescription>
                </CardHeader>
                {loading ? (
                  <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 pt-0 pb-6 text-center">
                    <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                      Loading search results...
                    </p>
                  </CardContent>
                ) : null}

                {!loading && error ? (
                  <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 pt-0 pb-6 text-center">
                    <p className="text-destructive max-w-md text-sm leading-relaxed">{error}</p>
                    <Button type="button" variant="outline" onClick={retry}>
                      Try again
                    </Button>
                  </CardContent>
                ) : null}

                {!loading && !error && results.length === 0 ? (
                  <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 pt-0 pb-6 text-center">
                    <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                      No professionals are visible yet. Check back soon for new support options.
                    </p>
                  </CardContent>
                ) : null}

                {!loading && !error && results.length > 0 ? (
                  <CardContent className="pt-0 pb-6">
                    <ul
                      className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2"
                      aria-live="polite"
                    >
                      {results.map((card) => (
                        <li key={card.professionalId} className="flex min-h-0 min-w-0 flex-col">
                          <SearchProviderCard
                            card={card}
                            deliveryModeFilter={deliveryModeFilter}
                          />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                ) : null}
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
