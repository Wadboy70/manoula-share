import {
  legalNameCharacterMessage,
  lengthOverLimitMessage,
  normalizePlainText,
  PROFILE_LIMITS,
} from '@/features/professionals/profile-validation'

export const INTAKE_LIMITS = {
  lookingForDetailsMax: 1000,
  emailMax: 254,
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ClientIntakeFormValues = {
  firstName: string
  lastName: string
  email: string
  specialtyIds: number[]
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
  lookingForDetails: string
}

export type ProfessionalIntakeFormValues = {
  firstName: string
  lastName: string
  email: string
  specialtyIds: number[]
  locationLabel: string
  placeId: string
  latitude: number | null
  longitude: number | null
  geocodedAt: string | null
  countryCode: string
  offersRemote: boolean
  offersInHome: boolean
  offersProviderLocation: boolean
  credentialType: string
  issuingBody: string
  registrationNumber: string
}

function validateNameFields(firstName: string, lastName: string): string | null {
  const normalizedFirst = normalizePlainText(firstName, PROFILE_LIMITS.firstNameMax)
  const normalizedLast = normalizePlainText(lastName, PROFILE_LIMITS.lastNameMax)

  if (!normalizedFirst.trim()) {
    return 'First name is required.'
  }
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

function validateEmail(email: string): string | null {
  const normalized = normalizePlainText(email, INTAKE_LIMITS.emailMax).toLowerCase()
  if (!normalized) return 'Email is required.'
  if (!EMAIL_REGEX.test(normalized)) return 'Enter a valid email address.'
  return null
}

function validateLocation(locationLabel: string, placeId: string): string | null {
  const label = normalizePlainText(locationLabel, PROFILE_LIMITS.locationMax)
  const place = normalizePlainText(placeId, PROFILE_LIMITS.placeIdMax)
  if (!label.trim()) return 'Please enter your location.'
  if (!place.trim()) return 'Select a location from the suggestions list.'
  if (label.length > PROFILE_LIMITS.locationMax) {
    return lengthOverLimitMessage('Location', label.length, PROFILE_LIMITS.locationMax)
  }
  return null
}

export function validateClientIntakeForm(values: ClientIntakeFormValues): string | null {
  const nameError = validateNameFields(values.firstName, values.lastName)
  if (nameError) return nameError

  const emailError = validateEmail(values.email)
  if (emailError) return emailError

  if (values.specialtyIds.length === 0) {
    return 'Please select at least one specialty.'
  }

  const locationError = validateLocation(values.locationLabel, values.placeId)
  if (locationError) return locationError

  if (values.lookingForDetails.length > INTAKE_LIMITS.lookingForDetailsMax) {
    return lengthOverLimitMessage(
      'Details',
      values.lookingForDetails.length,
      INTAKE_LIMITS.lookingForDetailsMax,
    )
  }

  return null
}

export function validateProfessionalIntakeForm(
  values: ProfessionalIntakeFormValues,
): string | null {
  const nameError = validateNameFields(values.firstName, values.lastName)
  if (nameError) return nameError

  const emailError = validateEmail(values.email)
  if (emailError) return emailError

  if (values.specialtyIds.length === 0) {
    return 'Please select at least one specialty.'
  }

  const locationError = validateLocation(values.locationLabel, values.placeId)
  if (locationError) return locationError

  if (!values.offersRemote && !values.offersInHome && !values.offersProviderLocation) {
    return 'Select at least one location preference.'
  }

  const credentialType = normalizePlainText(values.credentialType, PROFILE_LIMITS.credentialTypeMax)
  const issuingBody = normalizePlainText(values.issuingBody, PROFILE_LIMITS.issuingBodyMax)
  if (!credentialType.trim() || !issuingBody.trim()) {
    return 'Credential type and issuing body are required.'
  }

  return null
}

export function normalizeClientIntakePayload(values: ClientIntakeFormValues) {
  return {
    first_name: normalizePlainText(values.firstName, PROFILE_LIMITS.firstNameMax),
    last_name: normalizePlainText(values.lastName, PROFILE_LIMITS.lastNameMax),
    email: normalizePlainText(values.email, INTAKE_LIMITS.emailMax).toLowerCase(),
    specialty_ids: values.specialtyIds,
    location_label: normalizePlainText(values.locationLabel, PROFILE_LIMITS.locationMax),
    place_id: normalizePlainText(values.placeId, PROFILE_LIMITS.placeIdMax),
    latitude: values.latitude,
    longitude: values.longitude,
    geocoded_at: values.geocodedAt,
    country_code: values.countryCode || 'GB',
    looking_for_details: normalizePlainText(
      values.lookingForDetails,
      INTAKE_LIMITS.lookingForDetailsMax,
      { collapse: false },
    ),
  }
}

export function normalizeProfessionalIntakePayload(values: ProfessionalIntakeFormValues) {
  return {
    first_name: normalizePlainText(values.firstName, PROFILE_LIMITS.firstNameMax),
    last_name: normalizePlainText(values.lastName, PROFILE_LIMITS.lastNameMax),
    email: normalizePlainText(values.email, INTAKE_LIMITS.emailMax).toLowerCase(),
    specialty_ids: values.specialtyIds,
    location_label: normalizePlainText(values.locationLabel, PROFILE_LIMITS.locationMax),
    place_id: normalizePlainText(values.placeId, PROFILE_LIMITS.placeIdMax),
    latitude: values.latitude,
    longitude: values.longitude,
    geocoded_at: values.geocodedAt,
    country_code: values.countryCode || 'GB',
    offers_remote: values.offersRemote,
    offers_in_home: values.offersInHome,
    offers_provider_location: values.offersProviderLocation,
    credential_type: normalizePlainText(values.credentialType, PROFILE_LIMITS.credentialTypeMax),
    issuing_body: normalizePlainText(values.issuingBody, PROFILE_LIMITS.issuingBodyMax),
    registration_number: normalizePlainText(
      values.registrationNumber,
      PROFILE_LIMITS.registrationNumberMax,
    ),
  }
}
