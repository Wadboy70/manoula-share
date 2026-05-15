import { cn } from '@/lib/utils'

import type { MessageRow } from './messaging.types'

export type MessageBubbleProps = {
  message: MessageRow
  isOwn: boolean
  senderLabel: string
}

export function MessageBubble({ message, isOwn, senderLabel }: MessageBubbleProps) {
  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm sm:max-w-[70%]',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-zinc-100',
        )}
      >
        {!isOwn ? (
          <p className="text-muted-foreground mb-1 text-xs font-medium">{senderLabel}</p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            'mt-1 text-[10px] opacity-70',
            isOwn ? 'text-primary-foreground/80' : 'text-zinc-400',
          )}
        >
          {new Date(message.created_at).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
