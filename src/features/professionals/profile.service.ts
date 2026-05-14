import { supabase } from '@/lib/supabaseClient'

import { calculateProfileCompleteness } from './profile-completeness'
import { normalizePlainText, PROFILE_LIMITS } from './profile-validation'

export type ProfessionalCredentialInput = {
  id?: number
  credentialType: string
  issuingBody: string
  registrationNumber: string
}

export type ProfessionalProfileEditorData = {
  professionalId: number
  firstName: string
  lastName: string
  bio: string
  profilePhotoUrl: string
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
  isPublicSearchable: boolean
  specialtyIds: number[]
  credentials: ProfessionalCredentialInput[]
}

/** Stable serialization for comparing draft vs last-saved profile (dirty detection). */
export function serializeProfileEditorStateForDirtyCheck(data: ProfessionalProfileEditorData): string {
  return JSON.stringify({
    professionalId: data.professionalId,
    firstName: data.firstName,
    lastName: data.lastName,
    bio: data.bio,
    profilePhotoUrl: data.profilePhotoUrl,
    locationLabel: data.locationLabel,
    placeId: data.placeId,
    latitude: data.latitude,
    longitude: data.longitude,
    geocodedAt: data.geocodedAt,
    countryCode: data.countryCode,
    isPublicSearchable: data.isPublicSearchable,
    specialtyIds: [...data.specialtyIds].sort((a, b) => a - b),
    credentials: data.credentials.map((credential, index) => ({
      id: credential.id ?? `new-${index}`,
      credentialType: credential.credentialType,
      issuingBody: credential.issuingBody,
      registrationNumber: credential.registrationNumber,
    })),
  })
}

export type SpecialtyOption = {
  id: number
  label: string
}

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function fetchSpecialtyOptions(): Promise<ServiceResult<SpecialtyOption[]>> {
  const { data, error } = await supabase.from('specialties').select('id,label').order('label')
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data ?? [] }
}

async function fetchProfessionalIdForSession(): Promise<ServiceResult<number>> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: 'You must be signed in to edit your profile.' }
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id,is_professional')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (userError || !userRow) {
    return { ok: false, error: userError?.message ?? 'Unable to find your profile.' }
  }
  if (!userRow.is_professional) {
    return { ok: false, error: 'Only professionals can edit this profile.' }
  }
  return { ok: true, data: userRow.id }
}

export async function fetchProfessionalProfileEditorData(): Promise<
  ServiceResult<ProfessionalProfileEditorData>
> {
  const idResult = await fetchProfessionalIdForSession()
  if (!idResult.ok) return idResult
  const professionalId = idResult.data

  const [{ data: userRow, error: userError }, { data: profileRow, error: profileError }] =
    await Promise.all([
      supabase
        .from('users')
        .select('first_name,last_name,bio,profile_photo_url,country_code')
        .eq('id', professionalId)
        .single(),
      supabase
        .from('professional_search_profiles')
        .select('location_label,place_id,latitude,longitude,geocoded_at,is_public_searchable,country_code')
        .eq('user_id', professionalId)
        .single(),
    ])

  if (userError || profileError || !userRow || !profileRow) {
    return { ok: false, error: userError?.message ?? profileError?.message ?? 'Failed to load profile.' }
  }

  const [{ data: specialtyRows, error: specialtyError }, { data: credentialRows, error: credentialError }] =
    await Promise.all([
      supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', professionalId),
      supabase
        .from('professional_credentials')
        .select('id,credential_type,issuing_body,registration_number')
        .eq('professional_id', professionalId)
        .order('id', { ascending: true }),
    ])

  if (specialtyError || credentialError) {
    return {
      ok: false,
      error: specialtyError?.message ?? credentialError?.message ?? 'Failed to load profile details.',
    }
  }

  return {
    ok: true,
    data: {
      professionalId,
      firstName: userRow.first_name ?? '',
      lastName: userRow.last_name ?? '',
      bio: userRow.bio ?? '',
      profilePhotoUrl: userRow.profile_photo_url ?? '',
      locationLabel: profileRow.location_label ?? '',
      placeId: profileRow.place_id ?? '',
      latitude: profileRow.latitude ?? null,
      longitude: profileRow.longitude ?? null,
      geocodedAt: profileRow.geocoded_at ?? null,
      countryCode: profileRow.country_code ?? userRow.country_code ?? 'GB',
      isPublicSearchable: profileRow.is_public_searchable,
      specialtyIds: (specialtyRows ?? []).map((row) => row.specialty_id),
      credentials: (credentialRows ?? []).map((row) => ({
        id: row.id,
        credentialType: row.credential_type ?? '',
        issuingBody: row.issuing_body ?? '',
        registrationNumber: row.registration_number ?? '',
      })),
    },
  }
}

export async function uploadProfilePhoto(file: File): Promise<ServiceResult<string>> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: 'You must be signed in to upload a photo.' }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const sessionUserId = session?.user.id ?? null
  if (!sessionUserId) {
    return { ok: false, error: 'Session expired. Please sign in again before uploading a photo.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${sessionUserId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, {
    upsert: false,
    contentType: file.type,
  })
  if (uploadError) {
    const lower = uploadError.message.toLowerCase()
    if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
      return {
        ok: false,
        error:
          'Upload blocked by storage permissions. Please re-authenticate and confirm profile-photo storage policies are applied in this environment.',
      }
    }
    return { ok: false, error: uploadError.message }
  }

  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
  return { ok: true, data: data.publicUrl }
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

export async function saveProfessionalProfileEditorData(
  raw: ProfessionalProfileEditorData,
): Promise<ServiceResult<void>> {
  const payload = sanitizeProfessionalProfileEditorData(raw)

  const completeness = calculateProfileCompleteness({
    firstName: payload.firstName,
    lastName: payload.lastName,
    profilePhotoUrl: payload.profilePhotoUrl,
    bio: payload.bio,
    specialtyIds: payload.specialtyIds,
    locationLabel: payload.locationLabel,
    hasCredential: payload.credentials.some(
      (credential) =>
        credential.credentialType.trim().length > 0 && credential.issuingBody.trim().length > 0,
    ),
    visibilitySet: true,
  })

  const [{ error: userError }, { error: profileError }] = await Promise.all([
    supabase
      .from('users')
      .update({
        first_name: payload.firstName || null,
        last_name: payload.lastName || null,
        bio: payload.bio || null,
        profile_photo_url: payload.profilePhotoUrl || null,
      })
      .eq('id', payload.professionalId),
    supabase
      .from('professional_search_profiles')
      .update({
        location_label: payload.locationLabel || null,
        place_id: payload.placeId || null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        geocoded_at: payload.geocodedAt,
        country_code: payload.countryCode,
        is_public_searchable: payload.isPublicSearchable,
        is_profile_complete: completeness.isComplete,
      })
      .eq('user_id', payload.professionalId),
  ])

  if (userError || profileError) {
    return { ok: false, error: userError?.message ?? profileError?.message ?? 'Failed to save profile.' }
  }

  const { error: deleteSpecialtiesError } = await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', payload.professionalId)

  if (deleteSpecialtiesError) return { ok: false, error: deleteSpecialtiesError.message }

  if (payload.specialtyIds.length > 0) {
    const { error: insertSpecialtyError } = await supabase.from('professional_specialties').insert(
      payload.specialtyIds.map((specialtyId) => ({
        professional_id: payload.professionalId,
        specialty_id: specialtyId,
      })),
    )
    if (insertSpecialtyError) return { ok: false, error: insertSpecialtyError.message }
  }

  const existingIds = payload.credentials
    .map((credential) => credential.id)
    .filter((id): id is number => typeof id === 'number')
  const { data: existingRows, error: existingRowsError } = await supabase
    .from('professional_credentials')
    .select('id')
    .eq('professional_id', payload.professionalId)
  if (existingRowsError) return { ok: false, error: existingRowsError.message }

  const idsToDelete = (existingRows ?? []).map((row) => row.id).filter((id) => !existingIds.includes(id))
  if (idsToDelete.length > 0) {
    const { error: deleteCredentialsError } = await supabase
      .from('professional_credentials')
      .delete()
      .eq('professional_id', payload.professionalId)
      .in('id', idsToDelete)
    if (deleteCredentialsError) return { ok: false, error: deleteCredentialsError.message }
  }

  for (const credential of payload.credentials) {
    if (credential.id) {
      const { error } = await supabase
        .from('professional_credentials')
        .update({
          credential_type: credential.credentialType,
          credential_label: credential.credentialType,
          issuing_body: credential.issuingBody,
          registration_number: credential.registrationNumber || null,
        })
        .eq('id', credential.id)
        .eq('professional_id', payload.professionalId)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase.from('professional_credentials').insert({
        professional_id: payload.professionalId,
        credential_type: credential.credentialType,
        credential_label: credential.credentialType,
        issuing_body: credential.issuingBody,
        registration_number: credential.registrationNumber || null,
      })
      if (error) return { ok: false, error: error.message }
    }
  }

  return { ok: true, data: undefined }
}

export function sanitizeProfessionalProfileEditorData(
  raw: ProfessionalProfileEditorData,
): ProfessionalProfileEditorData {
  return {
    ...raw,
    firstName: normalizePlainText(raw.firstName, PROFILE_LIMITS.firstNameMax),
    lastName: normalizePlainText(raw.lastName, PROFILE_LIMITS.lastNameMax),
    bio: normalizePlainText(raw.bio, PROFILE_LIMITS.bioMax, { collapse: false }),
    locationLabel: normalizePlainText(raw.locationLabel, PROFILE_LIMITS.locationMax),
    placeId: normalizePlainText(raw.placeId, PROFILE_LIMITS.placeIdMax),
    latitude: raw.latitude,
    longitude: raw.longitude,
    geocodedAt: raw.geocodedAt,
    profilePhotoUrl: normalizePlainText(raw.profilePhotoUrl, PROFILE_LIMITS.profilePhotoUrlMax),
    credentials: raw.credentials.map(normalizeCredential),
  }
}
