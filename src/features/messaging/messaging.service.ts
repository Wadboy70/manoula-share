import { supabase } from '@/lib/supabaseClient'

import type { ConversationWithBooking, MessageRow, ServiceOption } from './messaging.types'

const CONVERSATION_LIST_SELECT = `
  id,
  last_activity_at,
  last_message_at,
  last_message_preview,
  booking:bookings!inner (
    id,
    client_id,
    professional_id,
    service_id,
    status,
    client:users!bookings_client_id_fkey ( id, first_name, last_name, profile_photo_url ),
    professional:users!bookings_professional_id_fkey ( id, first_name, last_name, profile_photo_url ),
    services ( id, title )
  )
`

export async function fetchConversations(): Promise<{
  data: ConversationWithBooking[] | null
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_LIST_SELECT)
    .order('last_activity_at', { ascending: false })

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return {
    data: (data ?? []) as unknown as ConversationWithBooking[],
    error: null,
  }
}

export async function fetchMessages(conversationId: number): Promise<{
  data: MessageRow[] | null
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return { data: data ?? [], error: null }
}

export async function fetchActiveServicesForProfessional(
  professionalId: number,
): Promise<{ data: ServiceOption[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('services')
    .select('id, title, description, professional_id, is_active, duration_minutes')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return { data: data ?? [], error: null }
}

export async function ensureMessagingConversation(
  professionalId: number,
  serviceId: number,
  scheduledAt?: string | null,
): Promise<{ conversationId: number | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('ensure_messaging_conversation', {
    p_professional_id: professionalId,
    p_service_id: serviceId,
    p_scheduled_at: scheduledAt ?? undefined,
  })

  if (error) {
    return { conversationId: null, error: new Error(error.message) }
  }

  if (typeof data !== 'number') {
    return { conversationId: null, error: new Error('Unexpected response from server.') }
  }

  return { conversationId: data, error: null }
}

export async function fetchConversationById(
  conversationId: number,
): Promise<{ data: ConversationWithBooking | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_LIST_SELECT)
    .eq('id', conversationId)
    .maybeSingle()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  if (!data) {
    return { data: null, error: null }
  }

  return { data: data as unknown as ConversationWithBooking, error: null }
}

export async function sendMessage(input: {
  conversationId: number
  senderId: number
  body: string
}): Promise<{ data: MessageRow | null; error: Error | null }> {
  const trimmed = input.body.trim()
  if (!trimmed) {
    return { data: null, error: new Error('Message cannot be empty.') }
  }
  if (trimmed.length > 8000) {
    return { data: null, error: new Error('Message is too long.') }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: trimmed,
    })
    .select('*')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}
