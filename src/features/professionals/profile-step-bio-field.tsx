import { lengthOverLimitMessage, PROFILE_LIMITS } from './profile-validation'

export type ProfileStepBioFieldProps = {
  idPrefix?: string
  bio: string
  onBioChange: (value: string) => void
}

export function ProfileStepBioField({ idPrefix = 'profile', bio, onBioChange }: ProfileStepBioFieldProps) {
  const bioLengthError =
    bio.length > PROFILE_LIMITS.bioMax
      ? lengthOverLimitMessage('Bio', bio.length, PROFILE_LIMITS.bioMax)
      : null

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={`${idPrefix}-bio`}>
        Bio / about
      </label>
      <textarea
        id={`${idPrefix}-bio`}
        value={bio}
        onChange={(event) => onBioChange(event.target.value)}
        rows={5}
        aria-invalid={bioLengthError ? true : undefined}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-none border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <p className="text-muted-foreground text-xs tabular-nums">
        {bio.length} / {PROFILE_LIMITS.bioMax}
      </p>
      {bioLengthError ? (
        <p className="text-destructive text-sm" role="alert">
          {bioLengthError}
        </p>
      ) : null}
    </div>
  )
}
