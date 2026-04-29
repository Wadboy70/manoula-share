import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

import { GenericBanner } from '@/components/generic-banner'
import { buttonVariants } from '@/components/ui/button'

type ProfileIncompletePromptProps = {
  percentage: number
  isComplete: boolean
  missingItems: string[]
  variant?: 'banner' | 'card' | 'inline'
  ctaHref?: string
  hideCta?: boolean
}

export function ProfileIncompletePrompt({
  percentage,
  isComplete,
  missingItems,
  variant = 'banner',
  ctaHref = '/dashboard/profile',
  hideCta = false,
}: ProfileIncompletePromptProps) {
  if (isComplete) return null

  return (
    <GenericBanner
      title={`Complete your profile (${percentage}%)`}
      description="Complete profiles are more trusted by clients and easier to discover in search."
      items={missingItems.slice(0, 4)}
      icon={<AlertCircle className="h-4 w-4 text-amber-400" aria-hidden />}
      tone="warning"
      variant={variant}
      action={
        hideCta ? null : (
          <Link
            to={ctaHref}
            className={buttonVariants({ size: 'sm', className: 'rounded-none' })}
          >
            Finish profile
          </Link>
        )
      }
    />
  )
}
