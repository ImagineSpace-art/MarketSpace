import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

type StoreGuestMessage = {
  id: number
  sender_role: 'guest' | 'owner'
  content: string
  created_at: string
}

type StoreGuestConversation = {
  id: string
  store_id: string
  listing_id: number | null
  listing_title?: string | null
  store_name?: string
  guest_name: string
  guest_contact: string
  owner_unread?: boolean
  last_message?: string
  last_sender_role?: 'guest' | 'owner'
  updated_at: string
  messages?: StoreGuestMessage[]
}

function isConversationSummary(value: unknown): value is StoreGuestConversation {
  if (!value || typeof value !== 'object') return false
  const conversation = value as Partial<StoreGuestConversation>
  return typeof conversation.id === 'string'
    && typeof conversation.store_id === 'string'
    && typeof conversation.guest_name === 'string'
    && typeof conversation.guest_contact === 'string'
}

function isConversation(value: unknown): value is StoreGuestConversation & { messages: StoreGuestMessage[] } {
  return isConversationSummary(value)
    && Array.isArray((value as StoreGuestConversation).messages)
}

function parseConversationList(value: unknown) {
  return Array.isArray(value) ? value.filter(isConversationSummary) : []
}

async function loadStoreGuestConversations() {
  const { data, error } = await supabase.rpc('get_my_store_guest_conversations')
  if (error) throw error
  return parseConversationList(data)
}

export function StoreGuestInbox() {
  const [conversations, setConversations] = useState<StoreGuestConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<(StoreGuestConversation & { messages: StoreGuestMessage[] }) | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const nextConversations = await loadStoreGuestConversations()
      setConversations(nextConversations)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Guest inquiries could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadStoreGuestConversations()
      .then((nextConversations) => {
        if (!active) return
        setConversations(nextConversations)
        setError('')
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Guest inquiries could not be loaded.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openConversation = async (conversationId: string) => {
    setError('')
    const { data, error: loadError } = await supabase.rpc('get_my_store_guest_conversation', {
      p_conversation_id: conversationId,
    })
    if (loadError) {
      setError(loadError.message)
      return
    }
    if (!isConversation(data)) {
      setError('The selected conversation could not be loaded.')
      return
    }
    setActiveConversation(data)
    setDraft('')
    await refresh()
  }

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeConversation || !draft.trim()) return
    setError('')
    setIsSending(true)
    const { error: sendError } = await supabase.rpc('send_owner_store_guest_message', {
      p_conversation_id: activeConversation.id,
      p_content: draft.trim(),
    })
    setIsSending(false)
    if (sendError) {
      setError(sendError.message)
      return
    }
    setDraft('')
    await openConversation(activeConversation.id)
  }

  return (
    <section className="store-owner-page store-guest-inbox" aria-label="Store inquiry inbox">
      <header className="store-owner-page-header">
        <div>
          <p>Store owner tools</p>
          <h1>Guest inquiries</h1>
          <span>Reply to shoppers who contacted your store without a MarketSpace account.</span>
        </div>
        <button type="button" className="store-message-secondary" onClick={() => void refresh()}>Refresh</button>
      </header>
      {error && <p className="store-message-error" role="alert">{error}</p>}
      <div className="store-owner-inbox-layout">
        <nav className="store-owner-conversation-list" aria-label="Guest conversations">
          {isLoading ? <p>Loading inquiries…</p> : null}
          {!isLoading && conversations.length === 0 && <p>No guest inquiries yet.</p>}
          {conversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              className={activeConversation?.id === conversation.id ? 'active' : ''}
              onClick={() => void openConversation(conversation.id)}
            >
              <strong>{conversation.guest_name}</strong>
              {conversation.owner_unread && <span className="store-inquiry-unread">New</span>}
              <small>{conversation.listing_title || 'Store inquiry'}</small>
              <span>{conversation.last_message || 'No messages yet'}</span>
            </button>
          ))}
        </nav>
        {activeConversation ? (
          <div className="store-owner-conversation">
            <header>
              <div>
                <h2>{activeConversation.guest_name}</h2>
                <a href={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activeConversation.guest_contact)
                  ? `mailto:${activeConversation.guest_contact}`
                  : `tel:${activeConversation.guest_contact}`}>
                  {activeConversation.guest_contact}
                </a>
                {activeConversation.listing_title && <p>Regarding: {activeConversation.listing_title}</p>}
              </div>
              <button type="button" className="store-message-secondary" onClick={() => setActiveConversation(null)}>Close</button>
            </header>
            <div className="store-message-history" aria-live="polite">
              {activeConversation.messages.map((message) => (
                <article key={message.id} className={`store-message-bubble ${message.sender_role}`}>
                  <span>{message.sender_role === 'owner' ? activeConversation.store_name || 'Your store' : activeConversation.guest_name}</span>
                  <p>{message.content}</p>
                  <time>{new Date(message.created_at).toLocaleString()}</time>
                </article>
              ))}
            </div>
            <form className="store-message-compose" onSubmit={(event) => void sendReply(event)}>
              <label>
                Reply to {activeConversation.guest_name}
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={5000} required />
              </label>
              <button type="submit" disabled={isSending || !draft.trim()}>{isSending ? 'Sending…' : 'Send reply'}</button>
            </form>
          </div>
        ) : (
          <div className="store-owner-inbox-empty">
            <span className="material-icons" aria-hidden="true">forum</span>
            <p>Select an inquiry to read and reply.</p>
          </div>
        )}
      </div>
    </section>
  )
}
