import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { displayName, formatShortRelativeTime } from './messaging-utils'
import type { ConversationWithBooking } from './messaging.types'

export type ConversationListProps = {
  conversations: ConversationWithBooking[]
  loading: boolean
  error: string | null
  currentUserId: number
  activeConversationId: number | null
  onRetry: () => void
}

export function ConversationList({
  conversations,
  loading,
  error,
  currentUserId,
  activeConversationId,
  onRetry,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="text-muted-foreground p-4 text-sm" aria-busy="true">
        Loading conversations…
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-b border-white/10 p-4 text-sm">
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          className="text-primary mt-2 underline"
          onClick={() => {
            onRetry()
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">No conversations yet</div>
    )
  }

  return (
    <ul className="flex min-h-0 flex-1 flex-col divide-y divide-white/10 overflow-y-auto">
      {conversations.map((c) => {
        const b = c.booking
        const other =
          b.client_id === currentUserId ? b.professional : b.client
        const preview = c.last_message_preview ?? 'Start the conversation'
        const active = activeConversationId === c.id

        return (
          <li key={c.id}>
            <NavLink
              to={`/messages/${c.id}`}
              className={cn(
                'flex gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5',
                active ? 'bg-white/10' : '',
              )}
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                {other.profile_photo_url ? (
                  <img
                    src={other.profile_photo_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div
                    className="text-muted-foreground flex size-full items-center justify-center text-xs"
                    aria-hidden
                  >
                    {displayName(other).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground truncate font-medium">
                    {displayName(other)}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatShortRelativeTime(c.last_activity_at)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{preview}</p>
              </div>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}
