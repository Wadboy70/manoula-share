import { useParams } from 'react-router-dom'

import { SiteHeader } from '@/components/site-header'

export function ProfessionalPage() {
  const { professionalId } = useParams<{ professionalId: string }>()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="font-body mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl text-white md:text-3xl">Professional profile</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Professional ID: <span className="text-foreground font-medium">{professionalId}</span>
        </p>
        <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
          Full profile details will appear here as this experience grows.
        </p>
      </main>
    </div>
  )
}
