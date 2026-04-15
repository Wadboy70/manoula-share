import { SiteHeader } from '@/components/site-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function SearchPage() {
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
                  <div className="space-y-2">
                    <label
                      htmlFor="search-filter-specialty"
                      className="text-sm leading-none font-medium text-white"
                    >
                      Specialty
                    </label>
                    <Input
                      id="search-filter-specialty"
                      disabled
                      placeholder="All specialties"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="search-filter-location"
                      className="text-sm leading-none font-medium text-white"
                    >
                      Location
                    </label>
                    <Input
                      id="search-filter-location"
                      disabled
                      placeholder="City or region"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="search-filter-availability"
                      className="text-sm leading-none font-medium text-white"
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
                  <h2
                    id="search-results-heading"
                    className="font-heading text-base leading-snug font-medium text-card-foreground"
                  >
                    Results
                  </h2>
                  <CardDescription>
                    When professionals match your criteria, they will show here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 pt-0 pb-6 text-center">
                  <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                    No results yet. This space will list professionals you can learn more about
                    and connect with in a calm, supportive environment.
                  </p>
                  <div
                    className="mt-2 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2"
                    aria-hidden
                  >
                    <div className="h-24 rounded-lg border border-dashed border-white/15 bg-white/5" />
                    <div className="h-24 rounded-lg border border-dashed border-white/15 bg-white/5" />
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
