import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfileStepCredentialFields } from '@/features/professionals/profile-step-credential-fields'
import type { ProfessionalCredentialInput } from '@/features/professionals/profile.service'
import { SpecialtySearchPicker } from '@/features/professionals/specialty-search-picker'
import { PROFILE_LIMITS } from '@/features/professionals/profile-validation'
import { LocationPicker } from '@/features/search/location-picker'
import type { LocationSuggestion } from '@/features/search/location.types'
import { fetchSearchSpecialtyOptions } from '@/features/search/specialties.service'

import { IntakeSuccessPanel } from './intake-success-panel'
import { submitProfessionalIntake } from './intake.service'
import type { ProfessionalIntakeFormValues } from './intake-validation'

function buildEmptyCredential(): ProfessionalCredentialInput {
  return {
    credentialType: '',
    issuingBody: '',
    registrationNumber: '',
  }
}

const initialValues: ProfessionalIntakeFormValues = {
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
  offersRemote: false,
  offersInHome: false,
  offersProviderLocation: false,
  credentialType: '',
  issuingBody: '',
  registrationNumber: '',
}

export function ProfessionalIntakePage() {
  const [values, setValues] = useState<ProfessionalIntakeFormValues>(initialValues)
  const [credential, setCredential] = useState<ProfessionalCredentialInput>(buildEmptyCredential)
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (hasUncommittedLocation) {
      setError('Select a location from the suggestions list.')
      return
    }

    setSubmitting(true)
    try {
      const result = await submitProfessionalIntake({
        ...values,
        credentialType: credential.credentialType,
        issuingBody: credential.issuingBody,
        registrationNumber: credential.registrationNumber,
      })
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
          message="We have your details. Our team will review your profile and reach out about joining the Manoula network."
        />
      </main>
    )
  }

  return (
    <main id="main-content" className="flex-1 px-6 py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="font-brand text-3xl font-medium text-white md:text-4xl">
          Join as a professional
        </h1>
        <p className="font-body mt-4 text-lg leading-relaxed text-zinc-300">
          Share your credentials and how you work. We will reach out to discuss connecting you with
          families who need your support.
        </p>

        <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="pro-first-name" className="text-sm font-medium text-zinc-200">
                First name
              </label>
              <Input
                id="pro-first-name"
                value={values.firstName}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, firstName: event.target.value }))
                }
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pro-last-name" className="text-sm font-medium text-zinc-200">
                Last name
              </label>
              <Input
                id="pro-last-name"
                value={values.lastName}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, lastName: event.target.value }))
                }
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="pro-email" className="text-sm font-medium text-zinc-200">
              Email
            </label>
            <Input
              id="pro-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <SpecialtySearchPicker
            id="pro-specialties"
            label="Specialties"
            labelClassName="text-zinc-200"
            options={specialtyOptions}
            value={values.specialtyIds}
            onChange={(nextIds) => setValues((prev) => ({ ...prev, specialtyIds: nextIds }))}
            disabled={specialtiesLoading}
          />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-200">Location preferences</legend>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-transparent"
                checked={values.offersRemote}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, offersRemote: event.target.checked }))
                }
              />
              Remote / virtual
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-transparent"
                checked={values.offersInHome}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, offersInHome: event.target.checked }))
                }
              />
              In your home
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-transparent"
                checked={values.offersProviderLocation}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    offersProviderLocation: event.target.checked,
                  }))
                }
              />
              At my practice / studio
            </label>
          </fieldset>

          <LocationPicker
            id="pro-location"
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
            <span className="text-sm font-medium text-zinc-200">Credentials</span>
            <ProfileStepCredentialFields credential={credential} onChange={setCredential} />
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
            disabled={submitting || specialtiesLoading}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      </div>
    </main>
  )
}
