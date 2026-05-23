import { useCallback, useEffect, useRef, useState } from 'react'

import { Link } from 'react-router-dom'

import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/features/auth'
import { acceptBooking, declineBooking } from '@/features/bookings/booking.service'
import { bookingStatusLabel } from '@/features/bookings/booking-status'
import { bookingsPath } from '@/features/bookings/booking-routes'
import { Button, buttonVariants } from '@/components/ui/button'

import { MessageBubble } from './message-bubble'
import { MessageComposer } from './message-composer'
import { sendMessage } from './messaging.service'
import { displayName, resolveSenderLabel } from './messaging-utils'
import type { ConversationWithBooking, MessageRow } from './messaging.types'
import { useMessages } from './use-messages'
import { useMessagesRealtime } from './use-messages-realtime'

export type MessageThreadPanelProps = {
  conversation: ConversationWithBooking
  onAfterSend: () => void
  onBookingStatusChange?: () => void | Promise<void>
  showMobileBack?: boolean
}

export function MessageThreadPanel({
  conversation,
  onAfterSend,
  onBookingStatusChange,
  showMobileBack,
}: MessageThreadPanelProps) {
  const { appUser } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, loading, error, reload, appendMessage } = useMessages(conversation.id)
  const [sending, setSending] = useState(false)
  const [bookingActionBusy, setBookingActionBusy] = useState(false)
  const [bookingActionError, setBookingActionError] = useState<string | null>(null)

  const onInsert = useCallback(
    (row: MessageRow) => {
      appendMessage(row)
    },
    [appendMessage],
  )

  useMessagesRealtime(conversation.id, onInsert)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, conversation.id])

  const b = conversation.booking
  const me = appUser?.id
  const isProfessionalOnBooking =
    Boolean(appUser?.is_professional) && me != null && b.professional_id === me
  const showBookingActions = isProfessionalOnBooking && b.status === 'pending'
  const bookingsRole = appUser?.is_professional ? 'professional' : 'client'
  const bookingDetailsHref = bookingsPath(bookingsRole, b.id)

  async function handleSend(body: string) {
    if (!me) throw new Error('Not signed in.')
    setSending(true)
    const { data: row, error: err } = await sendMessage({
      conversationId: conversation.id,
      senderId: me,
      body,
    })
    setSending(false)
    if (err) throw err
    if (row) appendMessage(row)
    onAfterSend()
  }

  async function handleBookingAction(action: 'accept' | 'decline') {
    setBookingActionBusy(true)
    setBookingActionError(null)
    const fn = action === 'accept' ? acceptBooking : declineBooking
    const { error: err } = await fn(b.id)
    setBookingActionBusy(false)
    if (err) {
      setBookingActionError(err.message)
      return
    }
    await onBookingStatusChange?.()
  }

  if (!me) {
    return <p className="text-muted-foreground p-4 text-sm">Sign in to view messages.</p>
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {showMobileBack ? (
              <Link
                to="/messages"
                className="text-muted-foreground hover:text-foreground inline-flex md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="size-5" />
              </Link>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-foreground truncate font-heading text-lg">
                {displayName(b.client_id === me ? b.professional : b.client)}
              </h2>
              <p className="text-muted-foreground truncate text-xs">
                {b.services?.title ?? 'Consultation'}
                {' · '}
                {bookingStatusLabel(b.status)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to={bookingDetailsHref}
              className={buttonVariants({
                size: 'sm',
                variant: 'outline',
                className: 'rounded-none',
              })}
            >
              View booking
            </Link>
            {showBookingActions ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bookingActionBusy}
                  className="rounded-none"
                  onClick={() => {
                    void handleBookingAction('decline')
                  }}
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={bookingActionBusy}
                  className="rounded-none"
                  onClick={() => {
                    void handleBookingAction('accept')
                  }}
                >
                  Accept
                </Button>
              </>
            ) : null}
          </div>
        </div>
        {bookingActionError ? (
          <p className="text-destructive mt-2 text-xs">{bookingActionError}</p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading messages…</p>
        ) : null}
        {error ? (
          <div className="text-sm">
            <p className="text-destructive">{error}</p>
            <button
              type="button"
              className="text-primary mt-2 underline"
              onClick={() => {
                void reload()
              }}
            >
              Try again
            </button>
          </div>
        ) : null}
        {!loading && !error && messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">Start the conversation</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.sender_id === me}
              senderLabel={resolveSenderLabel(m.sender_id, b.client, b.professional)}
            />
          ))}
        </div>
        <div ref={bottomRef} aria-hidden />
      </div>

      <MessageComposer
        disabled={loading || Boolean(error)}
        sending={sending}
        onSend={handleSend}
      />
    </div>
  )
}
