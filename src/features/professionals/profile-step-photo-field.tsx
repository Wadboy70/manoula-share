import type { ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'

import { isPhotoFileAllowed } from './profile-validation'

export type ProfileStepPhotoFieldProps = {
  idPrefix?: string
  profilePhotoUrl: string
  pendingPhotoPreviewUrl: string | null
  pendingPhotoFile: File | null
  onPhotoPicked: (event: ChangeEvent<HTMLInputElement>) => void
}

export function ProfileStepPhotoField({
  idPrefix = 'profile',
  profilePhotoUrl,
  pendingPhotoPreviewUrl,
  pendingPhotoFile,
  onPhotoPicked,
}: ProfileStepPhotoFieldProps) {
  const previewUrl = pendingPhotoPreviewUrl ?? profilePhotoUrl

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={`${idPrefix}-photo-upload`}>
        Profile photo
      </label>
      <Input
        id={`${idPrefix}-photo-upload`}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onPhotoPicked}
      />
      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt="Profile preview"
            className="border-foreground/10 h-24 w-24 rounded-full border object-cover"
          />
          {pendingPhotoFile ? (
            <p className="text-muted-foreground text-xs">
              New photo selected ({pendingPhotoFile.name}). It will upload when you continue.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No photo uploaded yet.</p>
      )}
      <p className="text-muted-foreground text-xs">Max 3 MB. JPG, PNG, or WebP.</p>
    </div>
  )
}

export { isPhotoFileAllowed }
