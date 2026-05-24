import { supabase } from '@/lib/supabaseClient'

import { calculateProfileCompleteness } from './profile-completeness'
import type { OnboardingProfileState } from './professional-onboarding-steps'
import {
  normalizePlainText,
  legalNameCharacterMessage,
  PROFILE_LIMITS,
} from './profile-validation'
import type { ProfessionalCredentialInput } from './profile.service'

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type OnboardingProfileData = OnboardingProfileState & {
  userId: number
  isProfessional: boolean
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
  isPublicSearchable: boolean
  credentials: ProfessionalCredentialInput[]
}

async function fetchSessionUserId(): Promise<ServiceResult<number>> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: 'You must be signed in to continue onboarding.' }
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (userError || !userRow) {
    return { ok: false, error: userError?.message ?? 'Unable to find your profile.' }
  }

  return { ok: true, data: userRow.id }
}

function toOnboardingState(
  userRow: {
    first_name: string | null
    last_name: string | null
    bio: string | null
    profile_photo_url: string | null
    country_code: string
    is_professional: boolean | null
  },
  profileRow: {
    location_label: string | null
    place_id: string | null
    latitude: number | null
    longitude: number | null
    geocoded_at: string | null
    country_code: string
    is_public_searchable: boolean
    is_profile_complete: boolean
  } | null,
  specialtyIds: number[],
  credentials: ProfessionalCredentialInput[],
): OnboardingProfileData {
  const hasCredential = credentials.some(
    (credential) =>
      credential.credentialType.trim().length > 0 && credential.issuingBody.trim().length > 0,
  )

  return {
    userId: 0,
    isProfessional: userRow.is_professional === true,
    firstName: userRow.first_name ?? '',
    lastName: userRow.last_name ?? '',
    profilePhotoUrl: userRow.profile_photo_url ?? '',
    bio: userRow.bio ?? '',
    specialtyIds,
    locationLabel: profileRow?.location_label ?? '',
    placeId: profileRow?.place_id ?? '',
    latitude: profileRow?.latitude ?? null,
    longitude: profileRow?.longitude ?? null,
    geocodedAt: profileRow?.geocoded_at ?? null,
    countryCode: profileRow?.country_code ?? userRow.country_code ?? 'GB',
    isPublicSearchable: profileRow?.is_public_searchable ?? true,
    hasCredential,
    credentials,
  }
}

export async function fetchOnboardingProfileState(): Promise<ServiceResult<OnboardingProfileData>> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: 'You must be signed in to continue onboarding.' }
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select(
      'id,first_name,last_name,bio,profile_photo_url,country_code,is_professional',
    )
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (userError || !userRow) {
    return { ok: false, error: userError?.message ?? 'Unable to find your profile.' }
  }

  if (!userRow.is_professional) {
    return {
      ok: true,
      data: {
        ...toOnboardingState(userRow, null, [], []),
        userId: userRow.id,
      },
    }
  }

  const [{ data: profileRow, error: profileError }, { data: specialtyRows, error: specialtyError }, { data: credentialRows, error: credentialError }] =
    await Promise.all([
      supabase
        .from('professional_search_profiles')
        .select(
          'location_label,place_id,latitude,longitude,geocoded_at,country_code,is_public_searchable,is_profile_complete',
        )
        .eq('user_id', userRow.id)
        .maybeSingle(),
      supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', userRow.id),
      supabase
        .from('professional_credentials')
        .select('id,credential_type,issuing_body,registration_number')
        .eq('professional_id', userRow.id)
        .order('id', { ascending: true }),
    ])

  if (profileError || specialtyError || credentialError) {
    return {
      ok: false,
      error: profileError?.message ?? specialtyError?.message ?? credentialError?.message ?? 'Failed to load profile.',
    }
  }

  const credentials = (credentialRows ?? []).map((row) => ({
    id: row.id,
    credentialType: row.credential_type ?? '',
    issuingBody: row.issuing_body ?? '',
    registrationNumber: row.registration_number ?? '',
  }))

  return {
    ok: true,
    data: {
      ...toOnboardingState(
        userRow,
        profileRow,
        (specialtyRows ?? []).map((row) => row.specialty_id),
        credentials,
      ),
      userId: userRow.id,
    },
  }
}

async function persistProfileCompleteness(
  userId: number,
  state: OnboardingProfileState,
): Promise<ServiceResult<void>> {
  const completeness = calculateProfileCompleteness(state)
  const { error } = await supabase
    .from('professional_search_profiles')
    .update({ is_profile_complete: completeness.isComplete })
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

function validateNameFields(firstName: string, lastName: string): string | null {
  const trimmedFirst = firstName.trim()
  const trimmedLast = lastName.trim()
  if (!trimmedFirst) return 'Please enter your first name.'
  if (!trimmedLast) return 'Please enter your last name.'

  const normalizedFirst = normalizePlainText(trimmedFirst, PROFILE_LIMITS.firstNameMax)
  const normalizedLast = normalizePlainText(trimmedLast, PROFILE_LIMITS.lastNameMax)

  if (normalizedFirst.length > PROFILE_LIMITS.firstNameMax) {
    return `First name must be ${PROFILE_LIMITS.firstNameMax} characters or fewer.`
  }
  if (normalizedLast.length > PROFILE_LIMITS.lastNameMax) {
    return `Last name must be ${PROFILE_LIMITS.lastNameMax} characters or fewer.`
  }

  const firstNameError = legalNameCharacterMessage('First name', normalizedFirst)
  if (firstNameError) return firstNameError
  const lastNameError = legalNameCharacterMessage('Last name', normalizedLast)
  if (lastNameError) return lastNameError

  return null
}

export async function saveOnboardingNameStep(input: {
  firstName: string
  lastName: string
}): Promise<ServiceResult<OnboardingProfileData>> {
  const validationError = validateNameFields(input.firstName, input.lastName)
  if (validationError) return { ok: false, error: validationError }

  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  const firstName = normalizePlainText(input.firstName, PROFILE_LIMITS.firstNameMax)
  const lastName = normalizePlainText(input.lastName, PROFILE_LIMITS.lastNameMax)

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName,
      last_name: lastName,
      is_professional: true,
    })
    .eq('id', idResult.data)

  if (error) return { ok: false, error: error.message }

  const { error: profileError } = await supabase
    .from('professional_search_profiles')
    .update({ is_public_searchable: true })
    .eq('user_id', idResult.data)

  if (profileError) return { ok: false, error: profileError.message }

  return fetchOnboardingProfileState()
}

export async function saveOnboardingPhotoStep(input: {
  profilePhotoUrl: string
}): Promise<ServiceResult<OnboardingProfileData>> {
  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  const profilePhotoUrl = normalizePlainText(input.profilePhotoUrl, PROFILE_LIMITS.profilePhotoUrlMax)
  if (!profilePhotoUrl.trim()) {
    return { ok: false, error: 'Please upload a profile photo.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ profile_photo_url: profilePhotoUrl })
    .eq('id', idResult.data)

  if (error) return { ok: false, error: error.message }

  const stateResult = await fetchOnboardingProfileState()
  if (!stateResult.ok) return stateResult

  const persistResult = await persistProfileCompleteness(idResult.data, {
    ...stateResult.data,
    profilePhotoUrl,
  })
  if (!persistResult.ok) return persistResult

  return fetchOnboardingProfileState()
}

export async function saveOnboardingBioStep(input: { bio: string }): Promise<ServiceResult<OnboardingProfileData>> {
  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  const bio = normalizePlainText(input.bio, PROFILE_LIMITS.bioMax, { collapse: false })
  if (!bio.trim()) return { ok: false, error: 'Please add a short bio.' }
  if (bio.length > PROFILE_LIMITS.bioMax) {
    return { ok: false, error: `Bio must be ${PROFILE_LIMITS.bioMax} characters or fewer.` }
  }

  const { error } = await supabase.from('users').update({ bio }).eq('id', idResult.data)
  if (error) return { ok: false, error: error.message }

  const stateResult = await fetchOnboardingProfileState()
  if (!stateResult.ok) return stateResult

  const persistResult = await persistProfileCompleteness(idResult.data, {
    ...stateResult.data,
    bio,
  })
  if (!persistResult.ok) return persistResult

  return fetchOnboardingProfileState()
}

export async function saveOnboardingSpecialtyStep(input: {
  specialtyIds: number[]
}): Promise<ServiceResult<OnboardingProfileData>> {
  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  if (input.specialtyIds.length === 0) {
    return { ok: false, error: 'Please select at least one specialty.' }
  }

  const { error: deleteError } = await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', idResult.data)

  if (deleteError) return { ok: false, error: deleteError.message }

  const { error: insertError } = await supabase.from('professional_specialties').insert(
    input.specialtyIds.map((specialtyId) => ({
      professional_id: idResult.data,
      specialty_id: specialtyId,
    })),
  )

  if (insertError) return { ok: false, error: insertError.message }

  const stateResult = await fetchOnboardingProfileState()
  if (!stateResult.ok) return stateResult

  const persistResult = await persistProfileCompleteness(idResult.data, {
    ...stateResult.data,
    specialtyIds: input.specialtyIds,
  })
  if (!persistResult.ok) return persistResult

  return fetchOnboardingProfileState()
}

export async function saveOnboardingLocationStep(input: {
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
}): Promise<ServiceResult<OnboardingProfileData>> {
  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  const locationLabel = normalizePlainText(input.locationLabel, PROFILE_LIMITS.locationMax)
  const placeId = normalizePlainText(input.placeId, PROFILE_LIMITS.placeIdMax)

  if (!locationLabel.trim()) return { ok: false, error: 'Please enter your location.' }
  if (!placeId.trim()) {
    return { ok: false, error: 'Select a location from the suggestions list.' }
  }

  const { error } = await supabase
    .from('professional_search_profiles')
    .update({
      location_label: locationLabel,
      place_id: placeId,
      latitude: input.latitude,
      longitude: input.longitude,
      geocoded_at: input.geocodedAt,
      country_code: input.countryCode,
    })
    .eq('user_id', idResult.data)

  if (error) return { ok: false, error: error.message }

  const stateResult = await fetchOnboardingProfileState()
  if (!stateResult.ok) return stateResult

  const persistResult = await persistProfileCompleteness(idResult.data, {
    ...stateResult.data,
    locationLabel,
  })
  if (!persistResult.ok) return persistResult

  return fetchOnboardingProfileState()
}

function normalizeCredential(input: ProfessionalCredentialInput): ProfessionalCredentialInput {
  return {
    id: input.id,
    credentialType: normalizePlainText(input.credentialType, PROFILE_LIMITS.credentialTypeMax),
    issuingBody: normalizePlainText(input.issuingBody, PROFILE_LIMITS.issuingBodyMax),
    registrationNumber: normalizePlainText(
      input.registrationNumber,
      PROFILE_LIMITS.registrationNumberMax,
    ),
  }
}

export async function saveOnboardingCredentialStep(input: {
  credential: ProfessionalCredentialInput
}): Promise<ServiceResult<OnboardingProfileData>> {
  const idResult = await fetchSessionUserId()
  if (!idResult.ok) return idResult

  const credential = normalizeCredential(input.credential)
  if (!credential.credentialType.trim() || !credential.issuingBody.trim()) {
    return { ok: false, error: 'Credential type and issuing body are required.' }
  }

  const { error } = await supabase.from('professional_credentials').insert({
    professional_id: idResult.data,
    credential_type: credential.credentialType,
    credential_label: credential.credentialType,
    issuing_body: credential.issuingBody,
    registration_number: credential.registrationNumber || null,
  })

  if (error) return { ok: false, error: error.message }

  const stateResult = await fetchOnboardingProfileState()
  if (!stateResult.ok) return stateResult

  const persistResult = await persistProfileCompleteness(idResult.data, {
    ...stateResult.data,
    hasCredential: true,
  })
  if (!persistResult.ok) return persistResult

  return fetchOnboardingProfileState()
}

export { fetchSpecialtyOptions, uploadProfilePhoto } from './profile.service'
