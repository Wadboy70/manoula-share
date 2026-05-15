import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

import {
  deliveryModalityLabelsFromServices,
  type SearchCard,
  type SearchCardService,
} from '@/features/search/search.types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function renderSearchCardName(card: SearchCard): string {
  const joined = [card.firstName, card.lastName]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim()
  return joined.length > 0 ? joined : 'Professional'
}

export function renderSearchCardLocationLabel(card: SearchCard): string {
  const label = card.locationLabel?.trim()
  return label && label.length > 0 ? label : 'Service area coming soon'
}

/** Specialty line: profile specialties joined, else deduped labels from services. */
function specialtyDisplayLine(card: SearchCard): string {
  if (card.specialties.length > 0) {
    return card.specialties.join(' · ')
  }
  const seen = new Set<string>()
  const parts: string[] = []
  for (const s of card.services) {
    const label = s.specialtyLabel?.trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    parts.push(label)
  }
  return parts.join(' · ')
}

function dedupeServicesById(services: SearchCardService[]): SearchCardService[] {
  const seen = new Set<number>()
  const out: SearchCardService[] = []
  for (const s of services) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  return out
}

export type SearchProviderCardProps = {
  card: SearchCard
  className?: string
}

export function SearchProviderCard({ card, className }: SearchProviderCardProps) {
  const displayName = renderSearchCardName(card)
  const nameId = `search-card-name-${card.professionalId}`
  const profileHref = `/professionals/${card.professionalId}`
  const bookConsultHref = `/messages/start/${card.professionalId}`
  const specialtyLine = specialtyDisplayLine(card)
  const services = dedupeServicesById(card.services)

  const modalities = deliveryModalityLabelsFromServices(services)
  const photoAlt =
    specialtyLine.length > 0 ? `${displayName}, ${specialtyLine.split(' · ')[0]}` : displayName

  const ratingLine =
    typeof card.ratingAvg === 'number' && Number.isFinite(card.ratingAvg) && (card.ratingCount ?? 0) > 0
      ? `${card.ratingAvg.toFixed(1)} ★ (${card.ratingCount} review${(card.ratingCount ?? 0) === 1 ? '' : 's'})`
      : null

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        'group flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-colors',
        'hover:border-white/20 hover:bg-white/10',
        className,
      )}
    >
      <div className="flex shrink-0 gap-5">
        <div className="relative shrink-0">
          {card.profilePhotoUrl ? (
            <img
              src={card.profilePhotoUrl}
              alt={photoAlt}
              className="ring-secondary size-24 shrink-0 rounded-full object-cover ring-4"
            />
          ) : (
            <div
              className="bg-input/30 ring-secondary size-24 shrink-0 rounded-full ring-4"
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 id={nameId} className="font-heading text-lg leading-snug font-medium text-white">
            {displayName}
          </h3>
          {specialtyLine.length > 0 ? (
            <p className="text-primary mt-0.5 text-sm font-medium">{specialtyLine}</p>
          ) : (
            <p className="text-muted-foreground mt-0.5 text-sm">Specialties coming soon</p>
          )}

          {ratingLine ? (
            <p className="text-muted-foreground mt-1 text-xs">{ratingLine}</p>
          ) : null}

          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span>{renderSearchCardLocationLabel(card)}</span>
          </div>

          {modalities.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Delivery options">
              {modalities.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {services.length > 0 ? (
        <div className="mt-4 min-h-0 shrink-0 border-t border-white/10 pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Services
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {services.map((service) => (
              <span
                key={service.id}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {service.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row">
        <Link
          to={bookConsultHref}
          className={cn(
            buttonVariants({ variant: 'default', size: 'default' }),
            'inline-flex flex-1 items-center justify-center no-underline',
          )}
        >
          Book consultation
        </Link>
        <Link
          to={profileHref}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'default' }),
            'inline-flex flex-1 items-center justify-center no-underline',
          )}
        >
          View profile
        </Link>
      </div>
    </article>
  )
}
