import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MessageContent } from '../../pages/MessagesPage'
import {
  createGuestResumeSecret,
  formatGuestResumeCode,
  guestConversationStorageKey,
  parseGuestResumeCode,
} from './guestConversation'
import { getGuestMessagePreview, normalizeGuestMessageContent, type GuestStoreInquiryCard } from './guestMessageContent'

type GuestMessage = {
  id: number
  sender_role: 'guest' | 'owner'
  content: string
  created_at: string
}

type GuestConversation = {
  id: string
  store_id: string
  listing_id: number | null
  guest_name: string
  guest_contact: string
  created_at: string
  updated_at: string
  messages: GuestMessage[]
}

type SavedGuestConversation = {
  code: string
  guest_name?: string
  last_message?: string
  updated_at?: string
}

type GuestStoreMessagingProps = {
  isOpen: boolean
  storeId: string
  storeName: string
  initialView?: 'inbox' | 'compose'
  listingId?: number
  initialMessage?: string
  initialContact?: string
  initialInquiryCard?: GuestStoreInquiryCard
  onClose: () => void
}

function isGuestConversation(value: unknown): value is GuestConversation {
  if (!value || typeof value !== 'object') return false
  const conversation = value as Partial<GuestConversation>
  return typeof conversation.id === 'string'
    && typeof conversation.store_id === 'string'
    && typeof conversation.guest_name === 'string'
    && typeof conversation.guest_contact === 'string'
    && Array.isArray(conversation.messages)
}

function parseSavedConversation(value: unknown): SavedGuestConversation | null {
  if (typeof value === 'string') {
    return parseGuestResumeCode(value) ? { code: value } : null
  }
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<SavedGuestConversation>
  if (typeof saved.code !== 'string' || !parseGuestResumeCode(saved.code)) return null
  return {
    code: saved.code,
    guest_name: typeof saved.guest_name === 'string' ? saved.guest_name : undefined,
    last_message: typeof saved.last_message === 'string' ? getGuestMessagePreview(saved.last_message) : undefined,
    updated_at: typeof saved.updated_at === 'string' ? saved.updated_at : undefined,
  }
}

function getStoredResumeCodes(storeId: string) {
  try {
    const stored = localStorage.getItem(guestConversationStorageKey(storeId))
    const parsed: unknown = stored ? JSON.parse(stored) : []
    if (!Array.isArray(parsed)) {
      return { conversations: [], error: 'Saved conversations could not be read. Use a recovery code to resume a chat.' }
    }
    return {
      conversations: parsed.flatMap((item) => {
        const saved = parseSavedConversation(item)
        return saved ? [saved] : []
      }),
      error: '',
    }
  } catch {
    return {
      conversations: [],
      error: 'Saved conversations are unavailable in this browser. Use a recovery code to resume a chat.',
    }
  }
}

export function GuestStoreMessaging(props: GuestStoreMessagingProps) {
  const { isOpen, storeId, ...dialogProps } = props
  if (!isOpen) return null
  return <GuestStoreMessagingDialog key={storeId} storeId={storeId} {...dialogProps} />
}

function GuestStoreMessagingDialog({
  storeId,
  storeName,
  initialView = 'compose',
  listingId,
  initialMessage = '',
  initialContact = '',
  initialInquiryCard,
  onClose,
}: Omit<GuestStoreMessagingProps, 'isOpen'>) {
  const composeListingId = initialView === 'compose' ? listingId : undefined
  const composeInitialContact = initialView === 'compose' ? initialContact : ''
  const composeInitialMessage = initialView === 'compose' ? initialMessage : ''
  const composeInitialInquiryCard = initialView === 'compose' ? initialInquiryCard : undefined
  const [name, setName] = useState('')
  const [contact, setContact] = useState(composeInitialContact)
  const [draft, setDraft] = useState(composeInitialMessage || `Hello, I have a question about ${storeName}.`)
  const [resumeCode, setResumeCode] = useState('')
  const [conversation, setConversation] = useState<GuestConversation | null>(null)
  const [activeCode, setActiveCode] = useState('')
  const [isComposing, setIsComposing] = useState(initialView === 'compose')
  const [error, setError] = useState('')
  const [storedResumeState] = useState(() => getStoredResumeCodes(storeId))
  const [savedConversations, setSavedConversations] = useState(storedResumeState.conversations)
  const [notice, setNotice] = useState(storedResumeState.error)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingCode, setDeletingCode] = useState('')

  const saveResumeCode = (code: string, details?: GuestConversation) => {
    const stored = getStoredResumeCodes(storeId)
    const previous = stored.conversations.find((saved) => saved.code === code)
    const lastMessage = details?.messages[details.messages.length - 1]
    const nextConversation: SavedGuestConversation = {
      code,
      guest_name: details?.guest_name || previous?.guest_name,
      last_message: lastMessage ? getGuestMessagePreview(lastMessage.content) : previous?.last_message,
      updated_at: details?.updated_at || previous?.updated_at,
    }
    const nextConversations = [
      nextConversation,
      ...stored.conversations.filter((saved) => saved.code !== code),
    ].slice(0, 20)
    try {
      localStorage.setItem(guestConversationStorageKey(storeId), JSON.stringify(nextConversations))
      setSavedConversations(nextConversations)
      setNotice('Your chat is saved on this device. Copy the recovery code to reopen it on another device.')
    } catch {
      setNotice('Browser storage is unavailable. Copy the recovery code before closing this window.')
    }
  }

  const loadConversation = async (codeValue: string) => {
    const credentials = parseGuestResumeCode(codeValue)
    if (!credentials) {
      setError('That recovery code is not valid.')
      return
    }
    setError('')
    setNotice('')
    setIsLoading(true)
    const { data, error: loadError } = await supabase.rpc('get_guest_store_conversation', {
      p_conversation_id: credentials.conversationId,
      p_resume_secret: credentials.secret,
    })
    setIsLoading(false)
    if (loadError) {
      setError(loadError.message)
      return
    }
    if (!isGuestConversation(data) || data.store_id !== storeId) {
      setError('This recovery code does not belong to this store.')
      return
    }
    setConversation(data)
    const normalizedCode = formatGuestResumeCode(credentials)
    setActiveCode(normalizedCode)
    setIsComposing(false)
    saveResumeCode(normalizedCode, data)
  }

  const startConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || !contact.trim() || !draft.trim()) {
      setError('Enter your name, a contact method, and a message.')
      return
    }
    setError('')
    setNotice('')
    setIsLoading(true)
    const secret = createGuestResumeSecret()
    const firstMessage = composeInitialInquiryCard
      ? `[INQUIRY_CARD]${JSON.stringify({
        ...composeInitialInquiryCard,
        listingId: composeListingId ?? composeInitialInquiryCard.listingId,
        phone: contact.trim(),
        message: draft.trim() || null,
      })}`
      : draft.trim()
    const { data, error: startError } = await supabase.rpc('start_store_guest_conversation', {
      p_store_id: storeId,
      p_listing_id: composeListingId ?? null,
      p_guest_name: name.trim(),
      p_guest_contact: contact.trim(),
      p_initial_message: firstMessage,
      p_resume_secret: secret,
    })
    setIsLoading(false)
    if (startError) {
      setError(startError.message)
      return
    }
    if (typeof data !== 'string') {
      setError('The conversation could not be started. Please try again.')
      return
    }
    const code = formatGuestResumeCode({ conversationId: data, secret })
    setActiveCode(code)
    saveResumeCode(code)
    await loadConversation(code)
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const credentials = parseGuestResumeCode(activeCode)
    if (!credentials || !draft.trim()) return
    setError('')
    setIsLoading(true)
    const { error: sendError } = await supabase.rpc('send_guest_store_message', {
      p_conversation_id: credentials.conversationId,
      p_resume_secret: credentials.secret,
      p_content: draft.trim(),
    })
    setIsLoading(false)
    if (sendError) {
      setError(sendError.message)
      return
    }
    setDraft('')
    await loadConversation(activeCode)
  }

  const startNewInquiry = () => {
    setConversation(null)
    setActiveCode('')
    setError('')
    setName('')
    setContact(composeInitialContact)
    setDraft(composeInitialMessage || `Hello, I have a question about ${storeName}.`)
    setIsComposing(true)
  }

  const returnToInbox = () => {
    setConversation(null)
    setActiveCode('')
    setError('')
    setIsComposing(false)
  }

  const deleteConversation = async (saved: SavedGuestConversation) => {
    if (!window.confirm(`Delete your conversation with ${storeName}? This also removes it from the store's inbox.`)) return
    const credentials = parseGuestResumeCode(saved.code)
    if (!credentials) {
      setError('This conversation could not be deleted because its recovery code is invalid.')
      return
    }

    setError('')
    setDeletingCode(saved.code)
    const { error: deleteError } = await supabase.rpc('delete_guest_store_conversation', {
      p_conversation_id: credentials.conversationId,
      p_resume_secret: credentials.secret,
    })
    setDeletingCode('')
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    const nextConversations = savedConversations.filter((item) => item.code !== saved.code)
    setSavedConversations(nextConversations)
    try {
      localStorage.setItem(guestConversationStorageKey(storeId), JSON.stringify(nextConversations))
      setNotice('Conversation deleted.')
    } catch {
      setNotice('The conversation was deleted, but this browser could not update its saved chat list.')
    }
    if (activeCode === saved.code) {
      setConversation(null)
      setActiveCode('')
      setIsComposing(false)
    }
  }

  const copyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCode)
      setNotice('Recovery code copied.')
    } catch {
      setNotice('Copy failed. Select and copy the recovery code below.')
    }
  }

  return (
    <div className="messages-popup-backdrop store-guest-message-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="messages-popup-window store-guest-message-window" role="dialog" aria-modal="true" aria-labelledby="guest-store-message-title">
        <header className="messages-popup-header">
          <div className="store-guest-message-heading">
            <h2 id="guest-store-message-title">Messages</h2>
            <span>{storeName}</span>
          </div>
          <button type="button" aria-label="Close messages" onClick={onClose}>
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="messages-popup-content store-guest-message-content">
          {error && <p className="store-message-error" role="alert">{error}</p>}
          {notice && <p className="store-message-notice" role="status">{notice}</p>}
          <div className={`messenger-layout store-guest-messenger ${conversation || isComposing ? 'has-active-thread' : 'no-active-thread'}`}>
            <aside className="threads-sidebar">
              <div className="sidebar-header store-guest-sidebar-header">
                <h2>Your chats</h2>
                <button type="button" className="store-guest-new-chat" onClick={startNewInquiry}>
                  <span className="material-icons" aria-hidden="true">add</span>
                  New inquiry
                </button>
              </div>
              <div className="thread-list">
                {savedConversations.length === 0 ? (
                  <p className="empty-state">No saved chats yet.</p>
                ) : savedConversations.map((saved) => (
                  <div
                    key={saved.code}
                    className={`thread-item store-guest-thread ${activeCode === saved.code ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="store-guest-thread-main"
                      onClick={() => void loadConversation(saved.code)}
                      disabled={isLoading || Boolean(deletingCode)}
                    >
                      <span className="thread-avatar">{storeName.slice(0, 1).toUpperCase()}</span>
                      <span className="thread-details">
                        <span className="thread-top-row">
                          <strong>{storeName}</strong>
                        </span>
                        <span className="thread-subtitle">{saved.last_message || 'Conversation with the store'}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="store-guest-delete-chat"
                      aria-label={`Delete conversation with ${storeName}`}
                      title="Delete chat"
                      onClick={() => void deleteConversation(saved)}
                      disabled={Boolean(deletingCode)}
                    >
                      <span className="material-icons" aria-hidden="true">delete_outline</span>
                    </button>
                  </div>
                ))}
              </div>
              <form className="store-guest-recovery" onSubmit={(event) => {
                event.preventDefault()
                void loadConversation(resumeCode)
              }}>
                <label htmlFor="guest-recovery-code">Have a recovery code?</label>
                <input
                  id="guest-recovery-code"
                  value={resumeCode}
                  onChange={(event) => setResumeCode(event.target.value)}
                  autoComplete="off"
                />
                <button type="submit" disabled={isLoading || !resumeCode.trim()}>
                  <span className="material-icons" aria-hidden="true">login</span>
                  Resume chat
                </button>
              </form>
            </aside>

            {conversation ? (
              <section className="conversation-pane">
                <header className="conversation-header">
                  <button type="button" className="mobile-back-btn" aria-label="Back to messages" onClick={returnToInbox}>
                    <span className="material-icons" aria-hidden="true">arrow_back</span>
                  </button>
                  <div className="conversation-info">
                    <strong>{storeName}</strong>
                    <p>{conversation.guest_contact}</p>
                  </div>
                  <button type="button" className="action-btn" onClick={() => void copyRecoveryCode()}>
                    Copy recovery code
                  </button>
                </header>
                <div className="message-history" aria-live="polite">
                  {conversation.messages.map((message) => (
                    <div key={message.id} className={`message-row ${message.sender_role === 'guest' ? 'sent' : 'received'}`}>
                      <div className="message-bubble">
                        <MessageContent content={normalizeGuestMessageContent(message.content, conversation.listing_id || undefined)} />
                        <span className="message-time">{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="composer-area store-guest-composer" onSubmit={(event) => void sendMessage(event)}>
                  <textarea
                    className="composer-input"
                    aria-label="Type a message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    rows={1}
                    maxLength={5000}
                    placeholder="Type a message..."
                  />
                  <button className="send-btn" type="submit" disabled={isLoading || !draft.trim()}>
                    {isLoading ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </section>
            ) : isComposing ? (
              <section className="conversation-pane store-guest-compose-pane">
                <header className="conversation-header">
                  <button type="button" className="mobile-back-btn" aria-label="Back to messages" onClick={returnToInbox}>
                    <span className="material-icons" aria-hidden="true">arrow_back</span>
                  </button>
                  <div className="conversation-info">
                    <strong>New inquiry</strong>
                    <p>Message {storeName}</p>
                  </div>
                  <button type="button" className="action-btn" onClick={returnToInbox}>Cancel</button>
                </header>
                <form className="store-guest-inquiry-form" onSubmit={(event) => void startConversation(event)}>
                  <p>Your message goes directly to the store. No MarketSpace account is needed.</p>
                  <label>
                    Your name
                    <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} required />
                  </label>
                  <label>
                    Email or phone number
                    <input value={contact} onChange={(event) => setContact(event.target.value)} autoComplete="email" maxLength={254} required />
                  </label>
                  <label>
                    Message
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} maxLength={5000} required />
                  </label>
                  <button className="send-btn" type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending…' : 'Send inquiry'}
                  </button>
                </form>
              </section>
            ) : (
              <div className="no-chat-selected">
                <div>
                  <span className="material-icons" aria-hidden="true">chat</span>
                  <p>Select a conversation or start a new inquiry.</p>
                  <button type="button" className="store-guest-empty-action" onClick={startNewInquiry}>Message the store</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
