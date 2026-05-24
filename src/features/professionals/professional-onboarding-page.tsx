import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth'
import { LocationPicker } from '@/features/search/location-picker'
import type { LocationSuggestion } from '@/features/search/location.types'
import { cn } from '@/lib/utils'

import { calculateProfileCompleteness } from './profile-completeness'
import {
  fetchOnboardingProfileState,
  fetchSpecialtyOptions,
  saveOnboardingBioStep,
  saveOnboardingCredentialStep,
  saveOnboardingLocationStep,
  saveOnboardingNameStep,
  saveOnboardingPhotoStep,
  saveOnboardingSpecialtyStep,
  uploadProfilePhoto,
  type OnboardingProfileData,
} from './professional-onboarding.service'
import {
  getOnboardingStepDefinition,
  getOnboardingStepIndex,
  ONBOARDING_STEP_COUNT,
  resolveOnboardingStep,
  type OnboardingStepId,
} from './professional-onboarding-steps'
import type { ProfessionalCredentialInput } from './profile.service'
import { ProfileStepBioField } from './profile-step-bio-field'
import { ProfileStepCredentialFields } from './profile-step-credential-fields'
import { ProfileStepNameFields } from './profile-step-name-fields'
import { isPhotoFileAllowed, ProfileStepPhotoField } from './profile-step-photo-field'
import { SpecialtySearchPicker } from './specialty-search-picker'
import { lengthOverLimitMessage, PROFILE_LIMITS } from './profile-validation'

type SpecialtyOption = {
  id: number
  label: string
}

type PageState = {
  loading: boolean
  saving: boolean
  error: string | null
}

function buildEmptyCredential(): ProfessionalCredentialInput {
  return {
    credentialType: '',
    issuingBody: '',
    registrationNumber: '',
  }
}

function toCompletenessInput(state: OnboardingProfileData) {
  return {
    firstName: state.firstName,
    lastName: state.lastName,
    profilePhotoUrl: state.profilePhotoUrl,
    bio: state.bio,
    specialtyIds: state.specialtyIds,
    locationLabel: state.locationLabel,
    hasCredential: state.hasCredential,
  }
}

export function ProfessionalOnboardingPage() {
  const navigate = useNavigate()
  const { user, loadAppUser } = useAuth()

  const [profile, setProfile] = useState<OnboardingProfileData | null>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStepId | 'complete'>('name')
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState<string | null>(null)
  const [credentialDraft, setCredentialDraft] = useState<ProfessionalCredentialInput>(buildEmptyCredential)
  const [state, setState] = useState<PageState>({
    loading: true,
    saving: false,
    error: null,
  })

  const bootstrap = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const [profileResult, specialtyResult] = await Promise.all([
      fetchOnboardingProfileState(),
      fetchSpecialtyOptions(),
    ])

    if (!profileResult.ok) {
      setState((prev) => ({ ...prev, loading: false, error: profileResult.error }))
      return
    }
    if (!specialtyResult.ok) {
      setState((prev) => ({ ...prev, loading: false, error: specialtyResult.error }))
      return
    }

    const loaded = profileResult.data
    const resolved = resolveOnboardingStep(loaded, { isProfessional: loaded.isProfessional })
    if (resolved === 'complete') {
      navigate('/dashboard', { replace: true, state: { onboardingComplete: true } })
      return
    }

    setProfile(loaded)
    setCurrentStep(resolved)
    setSpecialties(specialtyResult.data)
    setState((prev) => ({ ...prev, loading: false }))
  }, [navigate])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    return () => {
      if (pendingPhotoPreviewUrl) {
        URL.revokeObjectURL(pendingPhotoPreviewUrl)
      }
    }
  }, [pendingPhotoPreviewUrl])

  const completeness = useMemo(() => {
    if (!profile) {
      return calculateProfileCompleteness({
        firstName: '',
        lastName: '',
        profilePhotoUrl: '',
        bio: '',
        specialtyIds: [],
        locationLabel: '',
        hasCredential: false,
      })
    }
    return calculateProfileCompleteness(toCompletenessInput(profile))
  }, [profile])

  const stepDefinition =
    currentStep === 'complete' ? null : getOnboardingStepDefinition(currentStep)
  const stepNumber = currentStep === 'complete' ? ONBOARDING_STEP_COUNT : getOnboardingStepIndex(currentStep) + 1

  const locationLengthError =
    profile && profile.locationLabel.length > PROFILE_LIMITS.locationMax
      ? lengthOverLimitMessage('Location', profile.locationLabel.length, PROFILE_LIMITS.locationMax)
      : null

  const hasUncommittedLocation =
    profile !== null &&
    profile.locationLabel.trim().length > 0 &&
    profile.placeId.trim().length === 0

  const onPhotoPicked = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const allowed = isPhotoFileAllowed(file)
    if (!allowed.ok) {
      setState((prev) => ({ ...prev, error: allowed.message ?? 'Invalid image.' }))
      return
    }
    setState((prev) => ({ ...prev, error: null }))
    setPendingPhotoFile(file)
    setPendingPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }, [])

  async function afterStepSave(nextProfile: OnboardingProfileData) {
    if (user) {
      await loadAppUser(user)
    }
    const resolved = resolveOnboardingStep(nextProfile, { isProfessional: nextProfile.isProfessional })
    if (resolved === 'complete') {
      navigate('/dashboard', { replace: true, state: { onboardingComplete: true } })
      return
    }
    setProfile(nextProfile)
    setCurrentStep(resolved)
    setPendingPhotoFile(null)
    if (pendingPhotoPreviewUrl) {
      URL.revokeObjectURL(pendingPhotoPreviewUrl)
      setPendingPhotoPreviewUrl(null)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || currentStep === 'complete') return

    setState((prev) => ({ ...prev, saving: true, error: null }))

    let result:
      | { ok: true; data: OnboardingProfileData }
      | { ok: false; error: string }

    switch (currentStep) {
      case 'name':
        result = await saveOnboardingNameStep({
          firstName: profile.firstName,
          lastName: profile.lastName,
        })
        break
      case 'photo': {
        let photoUrl = profile.profilePhotoUrl
        if (pendingPhotoFile) {
          const uploadResult = await uploadProfilePhoto(pendingPhotoFile)
          if (!uploadResult.ok) {
            setState((prev) => ({ ...prev, saving: false, error: uploadResult.error }))
            return
          }
          photoUrl = uploadResult.data
        }
        result = await saveOnboardingPhotoStep({ profilePhotoUrl: photoUrl })
        break
      }
      case 'bio':
        result = await saveOnboardingBioStep({ bio: profile.bio })
        break
      case 'specialty':
        result = await saveOnboardingSpecialtyStep({ specialtyIds: profile.specialtyIds })
        break
      case 'location':
        if (hasUncommittedLocation || locationLengthError) {
          setState((prev) => ({
            ...prev,
            saving: false,
            error: hasUncommittedLocation
              ? 'Select a location from the suggestions list.'
              : (locationLengthError ?? 'Invalid location.'),
          }))
          return
        }
        result = await saveOnboardingLocationStep({
          locationLabel: profile.locationLabel,
          placeId: profile.placeId,
          latitude: profile.latitude,
          longitude: profile.longitude,
          geocodedAt: profile.geocodedAt,
          countryCode: profile.countryCode,
        })
        break
      case 'credential':
        result = await saveOnboardingCredentialStep({ credential: credentialDraft })
        break
      default:
        result = { ok: false, error: 'Unknown step.' }
    }

    if (!result.ok) {
      setState((prev) => ({ ...prev, saving: false, error: result.error }))
      return
    }

    setState((prev) => ({ ...prev, saving: false }))
    await afterStepSave(result.data)
  }

  if (state.loading) {
    return (
      <div className="font-body flex min-h-0 flex-1 items-center justify-center bg-[#1a1a1a] px-4 py-12">
        <p className="text-muted-foreground text-sm">Loading onboarding...</p>
      </div>
    )
  }

  if (state.error && !profile) {
    return (
      <div className="font-body flex min-h-0 flex-1 flex-col items-center justify-center bg-[#1a1a1a] px-4 py-12">
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      </div>
    )
  }

  if (!profile || !stepDefinition) {
    return null
  }

  const continueDisabled =
    state.saving ||
    (currentStep === 'photo' && !pendingPhotoFile && !profile.profilePhotoUrl.trim()) ||
    (currentStep === 'bio' && !profile.bio.trim()) ||
    (currentStep === 'specialty' && profile.specialtyIds.length === 0) ||
    (currentStep === 'location' && (hasUncommittedLocation || Boolean(locationLengthError))) ||
    (currentStep === 'credential' &&
      (!credentialDraft.credentialType.trim() || !credentialDraft.issuingBody.trim()))

  return (
    <div className="font-body flex min-h-0 flex-1 flex-col items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <Card className="w-full max-w-lg border-white/10 shadow-md">
        <CardHeader className="space-y-3">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs tabular-nums">
              Step {stepNumber} of {ONBOARDING_STEP_COUNT} · {completeness.percentage}% complete
            </p>
            <div className="bg-muted h-1.5 w-full">
              <div
                className="bg-primary h-1.5 transition-all"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>
          <CardTitle className="font-heading text-xl">{stepDefinition.title}</CardTitle>
          <CardDescription>{stepDefinition.description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {currentStep === 'name' ? (
              <ProfileStepNameFields
                idPrefix="onboarding"
                firstName={profile.firstName}
                lastName={profile.lastName}
                onFirstNameChange={(value) => setProfile((prev) => (prev ? { ...prev, firstName: value } : prev))}
                onLastNameChange={(value) => setProfile((prev) => (prev ? { ...prev, lastName: value } : prev))}
              />
            ) : null}

            {currentStep === 'photo' ? (
              <ProfileStepPhotoField
                idPrefix="onboarding"
                profilePhotoUrl={profile.profilePhotoUrl}
                pendingPhotoPreviewUrl={pendingPhotoPreviewUrl}
                pendingPhotoFile={pendingPhotoFile}
                onPhotoPicked={onPhotoPicked}
              />
            ) : null}

            {currentStep === 'bio' ? (
              <ProfileStepBioField
                idPrefix="onboarding"
                bio={profile.bio}
                onBioChange={(value) => setProfile((prev) => (prev ? { ...prev, bio: value } : prev))}
              />
            ) : null}

            {currentStep === 'specialty' ? (
              <SpecialtySearchPicker
                id="onboarding-specialties"
                options={specialties}
                value={profile.specialtyIds}
                onChange={(nextIds) =>
                  setProfile((prev) => (prev ? { ...prev, specialtyIds: nextIds } : prev))
                }
              />
            ) : null}

            {currentStep === 'location' ? (
              <div className="space-y-2">
                <LocationPicker
                  id="onboarding-location"
                  label="Location"
                  mode="profile"
                  hasResolvedPlaceId={profile.placeId.trim().length > 0}
                  value={profile.locationLabel}
                  onValueChange={(nextValue) =>
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            locationLabel: nextValue,
                            placeId: '',
                            latitude: null,
                            longitude: null,
                            geocodedAt: null,
                          }
                        : prev,
                    )
                  }
                  onSuggestionSelected={(suggestion: LocationSuggestion) =>
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            locationLabel: suggestion.label,
                            placeId: suggestion.placeId,
                            latitude: suggestion.latitude,
                            longitude: suggestion.longitude,
                            countryCode: suggestion.countryCode,
                            geocodedAt: new Date().toISOString(),
                          }
                        : prev,
                    )
                  }
                />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {profile.locationLabel.length} / {PROFILE_LIMITS.locationMax}
                </p>
                {locationLengthError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {locationLengthError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {currentStep === 'credential' ? (
              <ProfileStepCredentialFields
                credential={credentialDraft}
                onChange={setCredentialDraft}
              />
            ) : null}

            {state.error ? (
              <p className="text-destructive text-sm" role="alert" aria-live="polite">
                {state.error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 bg-transparent">
            <Button
              type="submit"
              className="w-full rounded-none"
              size="lg"
              disabled={continueDisabled}
            >
              {state.saving
                ? 'Saving...'
                : currentStep === 'credential'
                  ? 'Finish setup'
                  : 'Continue'}
            </Button>
            <Link
              to="/search"
              className={cn(
                'text-muted-foreground hover:text-foreground text-center text-sm underline-offset-4 hover:underline',
              )}
            >
              Finish later
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
