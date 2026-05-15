import { useCallback } from 'react'

import { Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth'

import { ConversationList } from './conversation-list'
import type { ConversationWithBooking } from './messaging.types'
import { useConversations } from './use-conversations'

export type MessagingOutletContext = {
  conversations: ConversationWithBooking[]
  reloadConversations: () => Promise<void>
  currentUserId: number
  conversationFromList: (id: number) => ConversationWithBooking | undefined
}

export function MessagingLayout() {
  const { appUser } = useAuth()
  const { pathname } = useLocation()
  const { conversations, loading, error, reload } = useConversations()

  const conversationFromList = useCallback(
    (id: number) => conversations.find((c) => c.id === id),
    [conversations],
  )

  const isStartPath = /^\/messages\/start\/\d+\/?$/.test(pathname)
  const isThreadPath = /^\/messages\/\d+\/?$/.test(pathname) && !isStartPath
  const threadMatch = pathname.match(/^\/messages\/(\d+)\/?$/)
  const conversationId =
    threadMatch && threadMatch[1] ? Number.parseInt(threadMatch[1], 10) : null

  if (!appUser) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Loading…
      </div>
    )
  }

  const showListOnMobile = !isThreadPath && !isStartPath

  const outletContext: MessagingOutletContext = {
    conversations,
    reloadConversations: reload,
    currentUserId: appUser.id,
    conversationFromList,
  }

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <main
        id="main-content"
        className="font-body mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-0 py-4 sm:px-4"
      >
        <h1 className="text-foreground px-4 font-heading text-2xl md:px-0">Messages</h1>
        <div className="mt-4 flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-none border border-white/10 bg-[#141414] md:rounded-lg">
          <aside
            className={
              isThreadPath || isStartPath
                ? 'hidden w-full shrink-0 border-white/10 md:flex md:w-72 md:flex-col md:border-r'
                : 'flex w-full shrink-0 flex-col border-white/10 md:w-72 md:border-r'
            }
          >
            <ConversationList
              conversations={conversations}
              loading={loading}
              error={error}
              currentUserId={appUser.id}
              activeConversationId={conversationId}
              onRetry={() => void reload()}
            />
          </aside>
          <section
            className={
              showListOnMobile
                ? 'hidden min-h-0 min-w-0 flex-1 flex-col md:flex'
                : 'flex min-h-0 min-w-0 flex-1 flex-col'
            }
          >
            <Outlet context={outletContext} />
          </section>
        </div>
      </main>
    </div>
  )
}
