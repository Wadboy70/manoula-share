export type ProfileStepVisibilityFieldProps = {
  isPublicSearchable: boolean
  onChange: (value: boolean) => void
}

export function ProfileStepVisibilityField({
  isPublicSearchable,
  onChange,
}: ProfileStepVisibilityFieldProps) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={isPublicSearchable}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        Public/searchable profile
        <span className="text-muted-foreground block">
          Your profile is public in search by default. Turn this off to hide from search.
        </span>
      </span>
    </label>
  )
}
