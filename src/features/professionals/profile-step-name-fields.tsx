import { Input } from '@/components/ui/input'

import { legalNameCharacterMessage, lengthOverLimitMessage, PROFILE_LIMITS } from './profile-validation'

export type ProfileStepNameFieldsProps = {
  idPrefix?: string
  firstName: string
  lastName: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
}

export function ProfileStepNameFields({
  idPrefix = 'profile',
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: ProfileStepNameFieldsProps) {
  const firstNameLengthError =
    firstName.length > PROFILE_LIMITS.firstNameMax
      ? lengthOverLimitMessage('First name', firstName.length, PROFILE_LIMITS.firstNameMax)
      : null
  const lastNameLengthError =
    lastName.length > PROFILE_LIMITS.lastNameMax
      ? lengthOverLimitMessage('Last name', lastName.length, PROFILE_LIMITS.lastNameMax)
      : null
  const firstNameCharacterError = legalNameCharacterMessage('First name', firstName)
  const lastNameCharacterError = legalNameCharacterMessage('Last name', lastName)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-first-name`}>
            First name
          </label>
          <Input
            id={`${idPrefix}-first-name`}
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            aria-invalid={firstNameLengthError || firstNameCharacterError ? true : undefined}
            required
            autoComplete="given-name"
          />
          <p className="text-muted-foreground text-xs tabular-nums">
            {firstName.length} / {PROFILE_LIMITS.firstNameMax}
          </p>
          {firstNameLengthError ? (
            <p className="text-destructive text-sm" role="alert">
              {firstNameLengthError}
            </p>
          ) : null}
          {firstNameCharacterError ? (
            <p className="text-destructive text-sm" role="alert">
              {firstNameCharacterError}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-last-name`}>
            Last name
          </label>
          <Input
            id={`${idPrefix}-last-name`}
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            aria-invalid={lastNameLengthError || lastNameCharacterError ? true : undefined}
            required
            autoComplete="family-name"
          />
          <p className="text-muted-foreground text-xs tabular-nums">
            {lastName.length} / {PROFILE_LIMITS.lastNameMax}
          </p>
          {lastNameLengthError ? (
            <p className="text-destructive text-sm" role="alert">
              {lastNameLengthError}
            </p>
          ) : null}
          {lastNameCharacterError ? (
            <p className="text-destructive text-sm" role="alert">
              {lastNameCharacterError}
            </p>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">Use your legal first and last name.</p>
    </div>
  )
}
