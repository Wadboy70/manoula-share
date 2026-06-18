import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IntakeSuccessPanelProps = {
  title: string
  message: string
}

export function IntakeSuccessPanel({ title, message }: IntakeSuccessPanelProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-400" aria-hidden />
      <h1 className="font-brand mt-6 text-3xl font-medium text-white">{title}</h1>
      <p className="font-body mt-4 text-lg leading-relaxed text-zinc-300">{message}</p>
      <Link
        to="/"
        className={cn(
          buttonVariants({ size: 'lg' }),
          'font-brand mt-10 inline-flex rounded-none bg-[#e5e5e5] px-8 text-black hover:bg-white',
        )}
      >
        Back to home
      </Link>
    </div>
  )
}
