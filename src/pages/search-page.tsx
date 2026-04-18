import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { SiteHeader } from '@/components/site-header'
import { fetchLocationSuggestions } from '@/features/search/location.service'
import type { LocationSuggestion } from '@/features/search/location.types'
import { RatingWithScore } from '@/components/rating-with-score'
import { useSearchResults } from '@/features/search/use-search-results'
import type { SearchCard } from '@/features/search/search.types'
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

function renderServiceArea(card: SearchCard): string {
  const area = card.serviceArea?.trim()
  return area && area.length > 0 ? area : 'Service area coming soon'
}

function renderName(card: SearchCard): string {
  const joined = [card.firstName, card.lastName]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim()

  return joined.length > 0 ? joined : 'Professional'
}

export function SearchPage() {
  const { loading, error, results, retry } = useSearchResults()

  const [locationInput, setLocationInput] = useState('')
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuggestSuppressed, setLocationSuggestSuppressed] = useState(false)
  const locationRequestIdRef = useRef(0)

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
      } catch (err) {
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
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="font-body flex flex-1 flex-col">
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
                    Narrow by specialty and location. More options coming soon.
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
                    <Input
                      id="search-filter-specialty"
                      disabled
                      placeholder="All specialties"
                    />
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
                          setLocationInput(e.target.value)
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
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-live="polite">
                      {results.map((card) => (
                        <li key={card.professionalId}>
                          <Link
                            to={`/professionals/${card.professionalId}`}
                            aria-label={`View profile for ${renderName(card)}`}
                            className={cn(
                              'block overflow-hidden rounded-lg border border-white/10 bg-white/5 text-left transition-colors',
                              'hover:border-white/20 hover:bg-white/10',
                              'focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            )}
                          >
                            <article>
                              {card.profilePhotoUrl ? (
                                <img
                                  src={card.profilePhotoUrl}
                                  alt=""
                                  className="aspect-[4/5] w-full object-cover object-top"
                                />
                              ) : (
                                <div className="bg-input/30 aspect-[4/5] w-full" aria-hidden="true" />
                              )}
                              <div className="flex min-w-0 flex-col gap-3 p-4">
                                <p className="font-heading text-base text-white">{renderName(card)}</p>
                                <RatingWithScore
                                  ratingAvg={card.ratingAvg}
                                  ratingCount={card.ratingCount}
                                />
                                <ul className="flex flex-wrap gap-2">
                                  {card.specialties.length > 0 ? (
                                    card.specialties.map((specialty) => (
                                      <li
                                        key={specialty}
                                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-medium text-white"
                                      >
                                        {specialty}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-muted-foreground text-sm">Specialties coming soon</li>
                                  )}
                                </ul>
                                <p className="text-muted-foreground text-sm">
                                  {renderServiceArea(card)}
                                </p>
                              </div>
                            </article>
                          </Link>
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
