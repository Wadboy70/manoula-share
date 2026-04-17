import { SiteHeader } from '@/components/site-header'
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

function renderLocation(card: SearchCard): string {
  const segments = [
    card.locationLocality,
    card.locationRegion,
    card.countryCode,
  ].filter((value): value is string => Boolean(value))

  return segments.length > 0 ? segments.join(', ') : 'Location coming soon'
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
              className="lg:sticky lg:top-6"
            >
              <Card>
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
                <CardContent className="flex flex-col gap-4 pt-0">
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
                    <Input
                      id="search-filter-location"
                      disabled
                      placeholder="City or region"
                    />
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
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-live="polite">
                      {results.map((card) => (
                        <li key={card.professionalId}>
                          <article className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-left">
                            {card.profilePhotoUrl ? (
                              <img
                                src={card.profilePhotoUrl}
                                alt={`${renderName(card)} profile photo`}
                                className="size-16 shrink-0 rounded-md object-cover ring-1 ring-white/10"
                              />
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="font-heading text-sm text-white">{renderName(card)}</p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {renderLocation(card)}
                              </p>
                              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                                {card.specialties.length > 0
                                  ? card.specialties.join(' · ')
                                  : 'Specialties coming soon'}
                              </p>
                            </div>
                          </article>
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
