import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { LocationPicker } from '@/features/search/location-picker'
import { fetchSearchSpecialtyOptions } from '@/features/search/specialties.service'
import type { SearchLocationFilter } from '@/features/search/search.types'
import {
  DELIVERY_MODES,
  DELIVERY_MODE_LABELS,
  type DeliveryModeFilterValue,
} from '@/features/search/delivery-mode-filter'
import { SearchProviderCard } from '@/features/search/search-provider-card'
import { useSearchResults } from '@/features/search/use-search-results'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SearchPage() {
  const { session } = useAuth()
  const [appliedSearchLocation, setAppliedSearchLocation] = useState<SearchLocationFilter | null>(null)
  const [selectedSpecialtyLabel, setSelectedSpecialtyLabel] = useState('')
  const specialtyLabelForSearch = selectedSpecialtyLabel.trim() === '' ? null : selectedSpecialtyLabel.trim()
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<DeliveryModeFilterValue>('')
  const deliveryModeForApi = deliveryModeFilter === '' ? null : deliveryModeFilter
  const { loading, loadingMore, error, results, truncated, hasMore, loadMore, retry } = useSearchResults(
    appliedSearchLocation,
    specialtyLabelForSearch,
    deliveryModeForApi,
  )

  const [specialtyOptions, setSpecialtyOptions] = useState<{ id: number; label: string }[]>([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true)
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null)

  const [locationInput, setLocationInput] = useState('')

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
              className="overflow-visible lg:sticky lg:top-[var(--site-header-sticky-offset)]"
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
                    Narrow results by specialty, where they work, and how you’d like to meet.
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
                    <LocationPicker
                      id="search-filter-location"
                      label="Location"
                      mode="search"
                      value={locationInput}
                      onValueChange={(value) => {
                        setLocationInput(value)
                        if (
                          appliedSearchLocation !== null &&
                          value.trim() !== (appliedSearchLocation.label ?? '').trim()
                        ) {
                          setAppliedSearchLocation(null)
                        }
                      }}
                      onSuggestionSelected={(suggestion) => {
                        setAppliedSearchLocation({
                          mapboxId: suggestion.mapboxId,
                          latitude: suggestion.latitude,
                          longitude: suggestion.longitude,
                          ancestorMapboxIds: suggestion.ancestorMapboxIds,
                          label: suggestion.label,
                        })
                      }}
                    />
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
                      : session === null && truncated
                        ? `Showing ${results.length} professionals. Sign in to browse the full directory.`
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
                  <CardContent className="flex flex-col gap-4 pt-0 pb-6">
                    <ul
                      className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2"
                      aria-live="polite"
                    >
                      {results.map((card) => (
                        <li key={card.professionalId} className="flex min-h-0 min-w-0 flex-col">
                          <SearchProviderCard card={card} />
                        </li>
                      ))}
                      {session === null && truncated ? (
                        <li className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
                          <article className="flex flex-1 flex-col justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              You&apos;re seeing a short preview. Create a free account to view every
                              professional that matches your filters.
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-3">
                              <Link
                                to="/signin"
                                className={buttonVariants({ variant: 'default', size: 'default' })}
                              >
                                Log in
                              </Link>
                              <Link
                                to="/signup"
                                className={buttonVariants({ variant: 'outline', size: 'default' })}
                              >
                                Sign up
                              </Link>
                            </div>
                          </article>
                        </li>
                      ) : null}
                    </ul>
                    {session !== null && hasMore ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loadingMore}
                          onClick={() => loadMore()}
                        >
                          {loadingMore ? 'Loading…' : 'Load more'}
                        </Button>
                      </div>
                    ) : null}
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
