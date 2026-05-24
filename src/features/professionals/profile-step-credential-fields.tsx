import { Input } from '@/components/ui/input'

import { lengthOverLimitMessage, PROFILE_LIMITS } from './profile-validation'
import type { ProfessionalCredentialInput } from './profile.service'

export type ProfileStepCredentialFieldsProps = {
  credential: ProfessionalCredentialInput
  onChange: (credential: ProfessionalCredentialInput) => void
}

export function ProfileStepCredentialFields({ credential, onChange }: ProfileStepCredentialFieldsProps) {
  const credentialTypeError =
    credential.credentialType.length > PROFILE_LIMITS.credentialTypeMax
      ? lengthOverLimitMessage(
          'Credential type',
          credential.credentialType.length,
          PROFILE_LIMITS.credentialTypeMax,
        )
      : null
  const issuingBodyError =
    credential.issuingBody.length > PROFILE_LIMITS.issuingBodyMax
      ? lengthOverLimitMessage(
          'Issuing body',
          credential.issuingBody.length,
          PROFILE_LIMITS.issuingBodyMax,
        )
      : null
  const registrationNumberError =
    credential.registrationNumber.length > PROFILE_LIMITS.registrationNumberMax
      ? lengthOverLimitMessage(
          'Registration number',
          credential.registrationNumber.length,
          PROFILE_LIMITS.registrationNumberMax,
        )
      : null

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Input
            placeholder="Credential type"
            value={credential.credentialType}
            aria-invalid={credentialTypeError ? true : undefined}
            onChange={(event) => onChange({ ...credential, credentialType: event.target.value })}
            required
          />
          <p className="text-muted-foreground text-xs tabular-nums">
            {credential.credentialType.length} / {PROFILE_LIMITS.credentialTypeMax}
          </p>
          {credentialTypeError ? (
            <p className="text-destructive text-sm" role="alert">
              {credentialTypeError}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Input
            placeholder="Issuing body"
            value={credential.issuingBody}
            aria-invalid={issuingBodyError ? true : undefined}
            onChange={(event) => onChange({ ...credential, issuingBody: event.target.value })}
            required
          />
          <p className="text-muted-foreground text-xs tabular-nums">
            {credential.issuingBody.length} / {PROFILE_LIMITS.issuingBodyMax}
          </p>
          {issuingBodyError ? (
            <p className="text-destructive text-sm" role="alert">
              {issuingBodyError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1">
        <Input
          placeholder="Registration number (optional)"
          value={credential.registrationNumber}
          aria-invalid={registrationNumberError ? true : undefined}
          onChange={(event) => onChange({ ...credential, registrationNumber: event.target.value })}
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          {credential.registrationNumber.length} / {PROFILE_LIMITS.registrationNumberMax}
        </p>
        {registrationNumberError ? (
          <p className="text-destructive text-sm" role="alert">
            {registrationNumberError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
