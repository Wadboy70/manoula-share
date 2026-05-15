import { useCallback, useEffect, useRef, useState } from 'react'

import { Link } from 'react-router-dom'

import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/features/auth'

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
  showMobileBack?: boolean
}

export function MessageThreadPanel({
  conversation,
  onAfterSend,
  showMobileBack,
}: MessageThreadPanelProps) {
  const { appUser } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, loading, error, reload, appendMessage } = useMessages(conversation.id)
  const [sending, setSending] = useState(false)

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

  if (!me) {
    return <p className="text-muted-foreground p-4 text-sm">Sign in to view messages.</p>
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
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
              <span className="capitalize">{b.status}</span>
            </p>
          </div>
        </div>
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
