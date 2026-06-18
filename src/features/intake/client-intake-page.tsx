import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SpecialtySearchPicker } from '@/features/professionals/specialty-search-picker'
import { lengthOverLimitMessage, PROFILE_LIMITS } from '@/features/professionals/profile-validation'
import { LocationPicker } from '@/features/search/location-picker'
import type { LocationSuggestion } from '@/features/search/location.types'
import { fetchSearchSpecialtyOptions } from '@/features/search/specialties.service'

import { IntakeSuccessPanel } from './intake-success-panel'
import { submitClientIntake } from './intake.service'
import { INTAKE_LIMITS, type ClientIntakeFormValues } from './intake-validation'

const initialValues: ClientIntakeFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  specialtyIds: [],
  locationLabel: '',
  placeId: '',
  latitude: null,
  longitude: null,
  geocodedAt: null,
  countryCode: 'GB',
  lookingForDetails: '',
}

export function ClientIntakePage() {
  const [values, setValues] = useState<ClientIntakeFormValues>(initialValues)
  const [hasUncommittedLocation, setHasUncommittedLocation] = useState(false)
  const [specialtyOptions, setSpecialtyOptions] = useState<{ id: number; label: string }[]>([])
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchSearchSpecialtyOptions()
      .then((rows) => {
        if (cancelled) return
        setSpecialtyOptions(rows)
        if (rows.length === 0) {
          setError('Specialties are unavailable right now. Please try again later.')
        }
        setSpecialtiesLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load specialties. Please refresh and try again.')
        setSpecialtiesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const detailsLengthError =
    values.lookingForDetails.length > INTAKE_LIMITS.lookingForDetailsMax
      ? lengthOverLimitMessage(
          'Details',
          values.lookingForDetails.length,
          INTAKE_LIMITS.lookingForDetailsMax,
        )
      : null

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (hasUncommittedLocation) {
      setError('Select a location from the suggestions list.')
      return
    }

    setSubmitting(true)
    try {
      const result = await submitClientIntake(values)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-16">
        <IntakeSuccessPanel
          title="Thank you"
          message="We have your details. Our team will review your needs and reach out to connect you with maternal wellness professionals who fit."
        />
      </main>
    )
  }

  return (
    <main id="main-content" className="flex-1 px-6 py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="font-brand text-3xl font-medium text-white md:text-4xl">Find support</h1>
        <p className="font-body mt-4 text-lg leading-relaxed text-zinc-300">
          Tell us a little about yourself and what you are looking for. We will reach out to help
          you connect with the right certified professional.
        </p>

        <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="client-first-name" className="text-sm font-medium text-zinc-200">
                First name
              </label>
              <Input
                id="client-first-name"
                value={values.firstName}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, firstName: event.target.value }))
                }
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="client-last-name" className="text-sm font-medium text-zinc-200">
                Last name
              </label>
              <Input
                id="client-last-name"
                value={values.lastName}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, lastName: event.target.value }))
                }
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="client-email" className="text-sm font-medium text-zinc-200">
              Email
            </label>
            <Input
              id="client-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <SpecialtySearchPicker
            id="client-specialties"
            label="Desired specialties"
            labelClassName="text-zinc-200"
            options={specialtyOptions}
            value={values.specialtyIds}
            onChange={(nextIds) => setValues((prev) => ({ ...prev, specialtyIds: nextIds }))}
            disabled={specialtiesLoading}
          />

          <LocationPicker
            id="client-location"
            mode="profile"
            hasResolvedPlaceId={values.placeId.trim().length > 0}
            label="Location"
            value={values.locationLabel}
            maxLength={PROFILE_LIMITS.locationMax}
            onValueChange={(nextValue) => {
              setHasUncommittedLocation(true)
              setValues((prev) => ({
                ...prev,
                locationLabel: nextValue,
                placeId: '',
                latitude: null,
                longitude: null,
                geocodedAt: null,
              }))
            }}
            onSuggestionSelected={(suggestion: LocationSuggestion) => {
              setHasUncommittedLocation(false)
              setValues((prev) => ({
                ...prev,
                locationLabel: suggestion.label,
                placeId: suggestion.placeId,
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                geocodedAt: suggestion.geocodedAt,
                countryCode: suggestion.countryCode,
              }))
            }}
          />

          <div className="space-y-2">
            <label htmlFor="client-looking-for" className="text-sm font-medium text-zinc-200">
              What are you looking for?
            </label>
            <Textarea
              id="client-looking-for"
              value={values.lookingForDetails}
              placeholder="Share your stage of pregnancy or postpartum, timing, and any preferences for how you would like to receive support."
              aria-invalid={detailsLengthError ? true : undefined}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, lookingForDetails: event.target.value }))
              }
            />
            <p className="text-muted-foreground text-xs tabular-nums">
              {values.lookingForDetails.length} / {INTAKE_LIMITS.lookingForDetailsMax}
            </p>
            {detailsLengthError ? (
              <p className="text-destructive text-sm" role="alert">
                {detailsLengthError}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-none bg-[#e5e5e5] text-black hover:bg-white sm:w-auto"
            disabled={submitting || specialtiesLoading || Boolean(detailsLengthError)}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      </div>
    </main>
  )
}
