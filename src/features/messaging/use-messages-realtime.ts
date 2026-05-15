import { useEffect } from 'react'

import { supabase } from '@/lib/supabaseClient'

import type { MessageRow } from './messaging.types'

export function useMessagesRealtime(
  conversationId: number | null,
  onInsert: (row: MessageRow) => void,
) {
  useEffect(() => {
    if (conversationId == null) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow
          if (row && typeof row.id === 'number') {
            onInsert(row)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Surface via parent if needed; keep hook minimal
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, onInsert])
}
