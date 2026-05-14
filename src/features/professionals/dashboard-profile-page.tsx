import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useBlocker } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth'
import { LocationPicker } from '@/features/search/location-picker'
import type { LocationSuggestion } from '@/features/search/location.types'

import { calculateProfileCompleteness } from './profile-completeness'
import { ProfileIncompletePrompt } from './profile-incomplete-prompt'
import { SpecialtySearchPicker } from './specialty-search-picker'
import {
  fetchProfessionalProfileEditorData,
  fetchSpecialtyOptions,
  sanitizeProfessionalProfileEditorData,
  saveProfessionalProfileEditorData,
  serializeProfileEditorStateForDirtyCheck,
  type ProfessionalCredentialInput,
  type ProfessionalProfileEditorData,
  uploadProfilePhoto,
} from './profile.service'
import {
  isPhotoFileAllowed,
  legalNameCharacterMessage,
  lengthOverLimitMessage,
  PROFILE_LIMITS,
} from './profile-validation'

type PageState = {
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
}

type SpecialtyOption = {
  id: number
  label: string
}

function buildEmptyProfile(): ProfessionalProfileEditorData {
  return {
    professionalId: 0,
    firstName: '',
    lastName: '',
    bio: '',
    profilePhotoUrl: '',
    locationLabel: '',
    placeId: '',
    latitude: null,
    longitude: null,
    geocodedAt: null,
    countryCode: 'GB',
    isPublicSearchable: false,
    specialtyIds: [],
    credentials: [],
  }
}

function buildEmptyCredential(): ProfessionalCredentialInput {
  return {
    credentialType: '',
    issuingBody: '',
    registrationNumber: '',
  }
}

function cloneProfile(data: ProfessionalProfileEditorData): ProfessionalProfileEditorData {
  return {
    ...data,
    specialtyIds: [...data.specialtyIds],
    credentials: data.credentials.map((c) => ({ ...c })),
  }
}

export function DashboardProfilePage() {
  const { user, loadAppUser } = useAuth()
  const [profile, setProfile] = useState<ProfessionalProfileEditorData>(buildEmptyProfile)
  const [baselineProfile, setBaselineProfile] = useState<ProfessionalProfileEditorData | null>(null)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [state, setState] = useState<PageState>({
    loading: true,
    saving: false,
    error: null,
    success: null,
  })

  const navigationConfirmShown = useRef(false)

  useEffect(() => {
    async function bootstrap() {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const [profileResult, specialtyResult] = await Promise.all([
        fetchProfessionalProfileEditorData(),
        fetchSpecialtyOptions(),
      ])
      if (!profileResult.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: profileResult.error,
        }))
        return
      }
      if (!specialtyResult.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: specialtyResult.error,
        }))
        return
      }
      const loaded = cloneProfile(profileResult.data)
      setProfile(loaded)
      setBaselineProfile(cloneProfile(profileResult.data))
      setSpecialties(specialtyResult.data)
      setState((prev) => ({ ...prev, loading: false }))
    }

    void bootstrap()
  }, [])

  const savedCompleteness = useMemo(() => {
    if (!baselineProfile) {
      return calculateProfileCompleteness({
        firstName: '',
        lastName: '',
        profilePhotoUrl: '',
        bio: '',
        specialtyIds: [],
        locationLabel: '',
        hasCredential: false,
        visibilitySet: false,
      })
    }
    const hasCredential = baselineProfile.credentials.some(
      (credential) =>
        credential.credentialType.trim().length > 0 && credential.issuingBody.trim().length > 0,
    )
    return calculateProfileCompleteness({
      firstName: baselineProfile.firstName,
      lastName: baselineProfile.lastName,
      profilePhotoUrl: baselineProfile.profilePhotoUrl,
      bio: baselineProfile.bio,
      specialtyIds: baselineProfile.specialtyIds,
      locationLabel: baselineProfile.locationLabel,
      hasCredential,
      visibilitySet: true,
    })
  }, [baselineProfile])

  const selectedSpecialtyLabels = useMemo(() => {
    const selectedSet = new Set(profile.specialtyIds)
    return specialties.filter((specialty) => selectedSet.has(specialty.id)).map((specialty) => specialty.label)
  }, [profile.specialtyIds, specialties])

  const isDirty = useMemo(() => {
    if (!baselineProfile) return false
    return serializeProfileEditorStateForDirtyCheck(profile) !== serializeProfileEditorStateForDirtyCheck(baselineProfile)
  }, [profile, baselineProfile])

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) return undefined
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      if (blocker.state === 'unblocked') {
        navigationConfirmShown.current = false
      }
      return
    }
    if (navigationConfirmShown.current) return
    navigationConfirmShown.current = true
    const leave = window.confirm(
      'You have unsaved changes. If you leave this page now, your edits will not be saved.',
    )
    if (leave) {
      blocker.proceed()
    } else {
      blocker.reset()
      navigationConfirmShown.current = false
    }
  }, [blocker])

  const lengthErrors = useMemo(() => {
    const firstName =
      profile.firstName.length > PROFILE_LIMITS.firstNameMax
        ? lengthOverLimitMessage('First name', profile.firstName.length, PROFILE_LIMITS.firstNameMax)
        : null
    const lastName =
      profile.lastName.length > PROFILE_LIMITS.lastNameMax
        ? lengthOverLimitMessage('Last name', profile.lastName.length, PROFILE_LIMITS.lastNameMax)
        : null
    const bio =
      profile.bio.length > PROFILE_LIMITS.bioMax
        ? lengthOverLimitMessage('Bio', profile.bio.length, PROFILE_LIMITS.bioMax)
        : null
    const location =
      profile.locationLabel.length > PROFILE_LIMITS.locationMax
        ? lengthOverLimitMessage('Location', profile.locationLabel.length, PROFILE_LIMITS.locationMax)
        : null

    const credentialFieldErrors = profile.credentials.map((credential) => ({
      credentialType:
        credential.credentialType.length > PROFILE_LIMITS.credentialTypeMax
          ? lengthOverLimitMessage(
              'Credential type',
              credential.credentialType.length,
              PROFILE_LIMITS.credentialTypeMax,
            )
          : null,
      issuingBody:
        credential.issuingBody.length > PROFILE_LIMITS.issuingBodyMax
          ? lengthOverLimitMessage(
              'Issuing body',
              credential.issuingBody.length,
              PROFILE_LIMITS.issuingBodyMax,
            )
          : null,
      registrationNumber:
        credential.registrationNumber.length > PROFILE_LIMITS.registrationNumberMax
          ? lengthOverLimitMessage(
              'Registration number',
              credential.registrationNumber.length,
              PROFILE_LIMITS.registrationNumberMax,
            )
          : null,
    }))

    return {
      firstName,
      lastName,
      bio,
      location,
      credentialFieldErrors,
    }
  }, [profile])

  const nameCharacterErrors = useMemo(
    () => ({
      firstName: legalNameCharacterMessage('First name', profile.firstName),
      lastName: legalNameCharacterMessage('Last name', profile.lastName),
    }),
    [profile.firstName, profile.lastName],
  )

  const hasLengthErrors = useMemo(() => {
    if (
      lengthErrors.firstName ||
      lengthErrors.lastName ||
      lengthErrors.bio ||
      lengthErrors.location ||
      nameCharacterErrors.firstName ||
      nameCharacterErrors.lastName
    ) {
      return true
    }
    return lengthErrors.credentialFieldErrors.some(
      (row) => row.credentialType || row.issuingBody || row.registrationNumber,
    )
  }, [lengthErrors, nameCharacterErrors])

  useEffect(() => {
    return () => {
      if (pendingPhotoPreviewUrl) {
        URL.revokeObjectURL(pendingPhotoPreviewUrl)
      }
    }
  }, [pendingPhotoPreviewUrl])

  const updateCredential = useCallback(
    (index: number, updater: (current: ProfessionalCredentialInput) => ProfessionalCredentialInput) => {
      setProfile((prev) => ({
        ...prev,
        credentials: prev.credentials.map((credential, currentIndex) =>
          currentIndex === index ? updater(credential) : credential,
        ),
      }))
    },
    [],
  )

  async function onPhotoPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const allowed = isPhotoFileAllowed(file)
    if (!allowed.ok) {
      setState((prev) => ({ ...prev, error: allowed.message ?? 'Invalid image.' }))
      return
    }

    setState((prev) => ({ ...prev, error: null, success: null }))
    if (pendingPhotoPreviewUrl) {
      URL.revokeObjectURL(pendingPhotoPreviewUrl)
    }
    setPendingPhotoFile(file)
    setPendingPhotoPreviewUrl(URL.createObjectURL(file))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasLengthErrors) return

    setState((prev) => ({ ...prev, saving: true, error: null, success: null }))

    let nextProfile = profile
    if (pendingPhotoFile) {
      const uploadResult = await uploadProfilePhoto(pendingPhotoFile)
      if (!uploadResult.ok) {
        setState((prev) => ({ ...prev, saving: false, error: uploadResult.error }))
        return
      }
      nextProfile = { ...profile, profilePhotoUrl: uploadResult.data }
    }

    const sanitized = sanitizeProfessionalProfileEditorData(nextProfile)
    const validCredentials = sanitized.credentials.filter(
      (credential) =>
        credential.credentialType.trim().length > 0 && credential.issuingBody.trim().length > 0,
    )

    const result = await saveProfessionalProfileEditorData({
      ...sanitized,
      credentials: validCredentials,
    })
    if (!result.ok) {
      setState((prev) => ({ ...prev, saving: false, error: result.error }))
      return
    }

    if (user) {
      await loadAppUser(user)
    }
    const next = cloneProfile({ ...sanitized, credentials: validCredentials })
    setProfile(next)
    setBaselineProfile(cloneProfile(next))
    setPendingPhotoFile(null)
    if (pendingPhotoPreviewUrl) {
      URL.revokeObjectURL(pendingPhotoPreviewUrl)
      setPendingPhotoPreviewUrl(null)
    }
    setState((prev) => ({
      ...prev,
      saving: false,
      success: 'Profile saved successfully.',
    }))
  }

  if (state.loading) {
    return <p className="text-muted-foreground text-sm">Loading profile...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-white md:text-3xl">Edit profile</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Keep your profile complete so clients can trust your expertise and discover you in search.
        </p>
      </header>

      <ProfileIncompletePrompt
        variant="banner"
        percentage={savedCompleteness.percentage}
        isComplete={savedCompleteness.isComplete}
        missingItems={savedCompleteness.missingItems}
        hideCta
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="space-y-6 lg:col-span-3">
          <Card className="relative z-30 overflow-visible">
            <CardHeader>
              <CardTitle>Basic profile</CardTitle>
              <CardDescription>These details show on your public card preview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="profile-first-name">
                    First name
                  </label>
                  <Input
                    id="profile-first-name"
                    value={profile.firstName}
                    onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                    aria-invalid={lengthErrors.firstName ? true : undefined}
                    required
                  />
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {profile.firstName.length} / {PROFILE_LIMITS.firstNameMax}
                  </p>
                  {lengthErrors.firstName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {lengthErrors.firstName}
                    </p>
                  ) : null}
                  {nameCharacterErrors.firstName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {nameCharacterErrors.firstName}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="profile-last-name">
                    Last name
                  </label>
                  <Input
                    id="profile-last-name"
                    value={profile.lastName}
                    onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                    aria-invalid={lengthErrors.lastName ? true : undefined}
                    required
                  />
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {profile.lastName.length} / {PROFILE_LIMITS.lastNameMax}
                  </p>
                  {lengthErrors.lastName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {lengthErrors.lastName}
                    </p>
                  ) : null}
                  {nameCharacterErrors.lastName ? (
                    <p className="text-destructive text-sm" role="alert">
                      {nameCharacterErrors.lastName}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Use your legal first and last name.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-photo-upload">
                  Profile photo
                </label>
                <Input id="profile-photo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhotoPicked} />
                {pendingPhotoPreviewUrl || profile.profilePhotoUrl ? (
                  <div className="space-y-2">
                    <img
                      src={pendingPhotoPreviewUrl ?? profile.profilePhotoUrl}
                      alt="Current profile"
                      className="border-foreground/10 h-24 w-24 rounded-full border object-cover"
                    />
                    {profile.profilePhotoUrl ? (
                      <p className="text-muted-foreground text-xs break-all">{profile.profilePhotoUrl}</p>
                    ) : null}
                    {pendingPhotoFile ? (
                      <p className="text-muted-foreground text-xs">
                        New photo selected ({pendingPhotoFile.name}). It will upload when you save.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">No photo uploaded yet.</p>
                )}
                <p className="text-muted-foreground text-xs">Max 3MB. JPG, PNG, or WebP.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-bio">
                  Bio / about
                </label>
                <textarea
                  id="profile-bio"
                  value={profile.bio}
                  onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                  rows={5}
                  aria-invalid={lengthErrors.bio ? true : undefined}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-none border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {profile.bio.length} / {PROFILE_LIMITS.bioMax}
                </p>
                {lengthErrors.bio ? (
                  <p className="text-destructive text-sm" role="alert">
                    {lengthErrors.bio}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <LocationPicker
                  id="profile-location"
                  label="Location"
                  mode="profile"
                  value={profile.locationLabel}
                  onValueChange={(nextValue) =>
                    setProfile((prev) => ({
                      ...prev,
                      locationLabel: nextValue,
                      placeId: '',
                      latitude: null,
                      longitude: null,
                      geocodedAt: null,
                    }))
                  }
                  onSuggestionSelected={(suggestion: LocationSuggestion) =>
                    setProfile((prev) => ({
                      ...prev,
                      locationLabel: suggestion.label,
                      placeId: suggestion.placeId,
                      latitude: suggestion.latitude,
                      longitude: suggestion.longitude,
                      countryCode: suggestion.countryCode,
                      geocodedAt: new Date().toISOString(),
                    }))
                  }
                />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {profile.locationLabel.length} / {PROFILE_LIMITS.locationMax}
                </p>
                {lengthErrors.location ? (
                  <p className="text-destructive text-sm" role="alert">
                    {lengthErrors.location}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="relative z-10 overflow-visible">
            <CardHeader>
              <CardTitle>Specialties</CardTitle>
              <CardDescription>
                Search and add specialties. Each one you add moves into the list above and is hidden from the
                dropdown until removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible">
              <SpecialtySearchPicker
                id="profile-specialties"
                options={specialties}
                value={profile.specialtyIds}
                onChange={(nextIds) => setProfile((prev) => ({ ...prev, specialtyIds: nextIds }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>
                Add credentials clients should see. Credential type and issuing body are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.credentials.length === 0 ? (
                <p className="text-muted-foreground text-sm">No credentials added yet.</p>
              ) : null}
              {profile.credentials.map((credential, index) => {
                const rowErrors = lengthErrors.credentialFieldErrors[index] ?? {
                  credentialType: null,
                  issuingBody: null,
                  registrationNumber: null,
                }
                return (
                  <div key={credential.id ?? `new-${index}`} className="border-foreground/10 space-y-3 border p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Input
                          placeholder="Credential type"
                          value={credential.credentialType}
                          aria-invalid={rowErrors.credentialType ? true : undefined}
                          onChange={(event) =>
                            updateCredential(index, (current) => ({
                              ...current,
                              credentialType: event.target.value,
                            }))
                          }
                          required
                        />
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {credential.credentialType.length} / {PROFILE_LIMITS.credentialTypeMax}
                        </p>
                        {rowErrors.credentialType ? (
                          <p className="text-destructive text-sm" role="alert">
                            {rowErrors.credentialType}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Input
                          placeholder="Issuing body"
                          value={credential.issuingBody}
                          aria-invalid={rowErrors.issuingBody ? true : undefined}
                          onChange={(event) =>
                            updateCredential(index, (current) => ({
                              ...current,
                              issuingBody: event.target.value,
                            }))
                          }
                          required
                        />
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {credential.issuingBody.length} / {PROFILE_LIMITS.issuingBodyMax}
                        </p>
                        {rowErrors.issuingBody ? (
                          <p className="text-destructive text-sm" role="alert">
                            {rowErrors.issuingBody}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Input
                          placeholder="Registration number (optional)"
                          value={credential.registrationNumber}
                          aria-invalid={rowErrors.registrationNumber ? true : undefined}
                          onChange={(event) =>
                            updateCredential(index, (current) => ({
                              ...current,
                              registrationNumber: event.target.value,
                            }))
                          }
                        />
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {credential.registrationNumber.length} / {PROFILE_LIMITS.registrationNumberMax}
                        </p>
                        {rowErrors.registrationNumber ? (
                          <p className="text-destructive text-sm" role="alert">
                            {rowErrors.registrationNumber}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-none sm:shrink-0"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            credentials: prev.credentials.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() =>
                  setProfile((prev) => ({
                    ...prev,
                    credentials: [...prev.credentials, buildEmptyCredential()],
                  }))
                }
              >
                Add credential
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control whether clients can find you in search.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={profile.isPublicSearchable}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      isPublicSearchable: event.target.checked,
                    }))
                  }
                />
                <span>
                  Public/searchable profile
                  <span className="text-muted-foreground block">
                    Turn this off to hide your profile from search.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>

          {state.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="text-emerald-400 text-sm">
              {state.success}
            </p>
          ) : null}

          <Button type="submit" disabled={state.saving || hasLengthErrors} className="rounded-none">
            {state.saving ? 'Saving profile...' : 'Save profile'}
          </Button>
        </form>

        <aside className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile completeness</CardTitle>
              <CardDescription>
                {savedCompleteness.percentage}% complete (last saved)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted h-2 w-full">
                <div className="bg-primary h-2" style={{ width: `${savedCompleteness.percentage}%` }} />
              </div>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                {savedCompleteness.missingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview (client view)</CardTitle>
              <CardDescription>How your card appears to clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground font-medium">
                {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your name'}
              </p>
              <p className="text-muted-foreground text-sm">
                {selectedSpecialtyLabels.length > 0
                  ? selectedSpecialtyLabels.join(', ')
                  : 'No specialty selected'}
              </p>
              <p className="text-muted-foreground text-sm">
                {profile.locationLabel || 'No location set'}
              </p>
              <p className="text-muted-foreground text-sm">{profile.bio || 'No bio added yet.'}</p>
              <Link
                to={`/professionals/${profile.professionalId || ''}`}
                className={buttonVariants({ variant: 'outline', className: 'rounded-none' })}
              >
                Open public profile page
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
