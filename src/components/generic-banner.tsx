import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type GenericBannerTone = 'neutral' | 'warning' | 'success'
type GenericBannerVariant = 'banner' | 'card' | 'inline'

type GenericBannerProps = {
  title: string
  description?: string
  items?: string[]
  icon?: ReactNode
  action?: ReactNode
  tone?: GenericBannerTone
  variant?: GenericBannerVariant
}

const variantClassNames: Record<GenericBannerVariant, string> = {
  banner: '',
  card: '',
  inline: 'border-white/10 bg-transparent',
}

const toneClassNames: Record<GenericBannerTone, string> = {
  neutral: '',
  warning: 'border-amber-500/30 bg-amber-500/5',
  success: 'border-emerald-500/30 bg-emerald-500/5',
}

export function GenericBanner({
  title,
  description,
  items = [],
  icon,
  action,
  tone = 'neutral',
  variant = 'banner',
}: GenericBannerProps) {
  return (
    <Card className={`${variantClassNames[variant]} ${toneClassNames[tone]}`.trim()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {items.length > 0 || action ? (
        <CardContent className="space-y-3">
          {items.length > 0 ? (
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {action}
        </CardContent>
      ) : null}
    </Card>
  )
}
