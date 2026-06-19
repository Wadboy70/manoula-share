import { ArrowLeft, Home, Search } from 'lucide-react'
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { isPrelaunchMode } from '@/lib/prelaunch'
import { cn } from '@/lib/utils'

type RouteErrorDetails = {
  status: number
  title: string
  description: string
  detail?: string
}

function resolveRouteError(error: unknown): RouteErrorDetails {
  if (isRouteErrorResponse(error) || error instanceof Response) {
    const status = error.status

    if (status === 404) {
      return {
        status: 404,
        title: 'Page not found',
        description:
          'The page you are looking for does not exist or may have moved. Check the address or head back to a known page.',
        detail: import.meta.env.DEV ? error.statusText : undefined,
      }
    }

    return {
      status,
      title: 'Something went wrong',
      description:
        'We could not load this page. Try again in a moment or return to the home page.',
      detail: import.meta.env.DEV
        ? isRouteErrorResponse(error) && typeof error.data === 'string'
          ? error.data
          : error.statusText
        : undefined,
    }
  }

  if (error instanceof Error) {
    return {
      status: 500,
      title: 'Something went wrong',
      description:
        'An unexpected error occurred while loading this page. Try again or return to the home page.',
      detail: import.meta.env.DEV ? error.message : undefined,
    }
  }

  return {
    status: 500,
    title: 'Something went wrong',
    description:
      'An unexpected error occurred while loading this page. Try again or return to the home page.',
  }
}

export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  const prelaunch = isPrelaunchMode()
  const { status, title, description, detail } = resolveRouteError(error)
  const isNotFound = status === 404

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center px-4 py-16 md:py-24"
    >
      <div className="w-full max-w-lg">
        <p
          className="font-brand text-center text-6xl font-medium tracking-[0.2em] text-white/90 md:text-7xl"
          aria-hidden
        >
          {status}
        </p>

        <Card className="mt-6 border-border/60 bg-card/80 shadow-none">
          <CardHeader className="space-y-2 text-center">
            <h1 className="font-heading text-2xl font-medium text-white">{title}</h1>
            <CardDescription className="font-body text-base leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'font-body gap-2 rounded-none bg-[#e5e5e5] text-black hover:bg-white',
                )}
              >
                <Home className="size-4" aria-hidden />
                Back to home
              </Link>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="font-body gap-2 rounded-none"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="size-4" aria-hidden />
                Go back
              </Button>
            </div>

            {prelaunch ? (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
                <Link
                  to="/find-support"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-body text-muted-foreground hover:text-white',
                  )}
                >
                  Find support
                </Link>
                <Link
                  to="/join"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-body text-muted-foreground hover:text-white',
                  )}
                >
                  Join as a professional
                </Link>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <Link
                  to="/search"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-body gap-2 text-muted-foreground hover:text-white',
                  )}
                >
                  <Search className="size-4" aria-hidden />
                  Browse professionals
                </Link>
              </div>
            )}

            {detail ? (
              <p className="font-mono pt-4 text-center text-xs text-muted-foreground/80">
                {detail}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {isNotFound ? (
          <p className="font-body mt-6 text-center text-sm text-muted-foreground">
            If you followed a link from email or another site, it may be outdated.
          </p>
        ) : null}
      </div>
    </main>
  )
}
