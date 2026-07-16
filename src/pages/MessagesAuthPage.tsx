import { useMemo, useState, type FormEvent } from 'react'
import type { ChatThread } from '../features/marketplace/useMarketplaceApp'

type MessagesPageProps = {
  chatThreads: ChatThread[]
  activeChatId: number | null
  canMessage: boolean
  chatDraft: string
  onSelectThread: (threadId: number) => void
  onToggleMute: () => void
  onDraftChange: (value: string) => void
  onSendMessage: () => void
}

export function MessagesPage({ chatThreads, activeChatId, canMessage, chatDraft, onSelectThread, onToggleMute, onDraftChange, onSendMessage }: MessagesPageProps) {
  const [chatCategory, setChatCategory] = useState('All')
  const activeThread = chatThreads.find((thread) => thread.id === activeChatId) ?? chatThreads[0]
  const chatCategories = ['All', 'Unread', 'Pinned', 'Favourites', 'Stores']
  const filteredThreads = useMemo(() => {
    if (chatCategory === 'Unread') {
      return chatThreads.filter((thread) => thread.unread)
    }
    if (chatCategory === 'Pinned') {
      return chatThreads.filter((thread) => thread.id === 1)
    }
    if (chatCategory === 'Favourites') {
      return chatThreads.filter((thread) => thread.id % 2 === 0)
    }
    if (chatCategory === 'Stores') {
      return chatThreads.filter((thread) => thread.participant.toLowerCase().includes('store') || thread.listingTitle.toLowerCase().includes('table'))
    }

    return chatThreads
  }, [chatCategory, chatThreads])

  return (
    <section className="section-card messages-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Messages</p>
          <h2>Inbox</h2>
        </div>
      </div>
      <div className="chat-category-row">
        {chatCategories.map((categoryItem) => (
          <button key={categoryItem} className={`chip-pill ${chatCategory === categoryItem ? 'active' : ''}`} onClick={() => setChatCategory(categoryItem)}>
            {categoryItem}
          </button>
        ))}
      </div>
      <div className="messages-layout">
        <div className="message-panel">
          {activeThread ? (
            <>
              <div className="thread-header">
                <div>
                  <strong>{activeThread.participant}</strong>
                  <p>{activeThread.listingTitle}</p>
                </div>
                <button className="ghost-btn" onClick={onToggleMute}>{canMessage ? 'Mute' : 'Unmute'}</button>
              </div>
              <div className="chat-bubble-list">
                {activeThread.messages.map((messageItem) => (
                  <div key={messageItem.id} className={`chat-bubble ${messageItem.sender === 'me' ? 'mine' : ''}`}>
                    <p>{messageItem.content}</p>
                    <span>{messageItem.time}</span>
                  </div>
                ))}
              </div>
              <div className="composer">
                <textarea value={chatDraft} onChange={(event) => onDraftChange(event.target.value)} rows={3} placeholder="Type a message" />
                <button className="primary-btn" onClick={onSendMessage}>Send</button>
              </div>
            </>
          ) : null}
        </div>
        <aside className="thread-list">
          {filteredThreads.length === 0 ? <p className="empty-state">No chats in this category.</p> : filteredThreads.map((thread) => (
            <button key={thread.id} className={`thread-item ${activeThread?.id === thread.id ? 'active' : ''}`} onClick={() => onSelectThread(thread.id)}>
              <strong>{thread.participant}</strong>
              <span>{thread.listingTitle}</span>
              {thread.unread ? <span className="badge">Unread</span> : null}
            </button>
          ))}
        </aside>
      </div>
    </section>
  )
}

type AuthPageProps = {
  mode: 'login' | 'signup'
  isSignedIn: boolean
  userEmail: string
  authEmail: string
  authPassword: string
  authUsername: string
  onAuthEmailChange: (value: string) => void
  onAuthPasswordChange: (value: string) => void
  onAuthUsernameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  onSwitchMode: () => void
  onLogout: () => void
  onGoProfile: () => void
}

export function AuthPage({ mode, isSignedIn, userEmail, authEmail, authPassword, authUsername, onAuthEmailChange, onAuthPasswordChange, onAuthUsernameChange, onSubmit, onSwitchMode, onLogout, onGoProfile }: AuthPageProps) {
  if (isSignedIn) {
    return (
      <section className="section-card auth-card-large">
        <div className="auth-panel">
          <div>
            <p className="eyebrow">Account</p>
            <h2>Signed in to MarketSpace</h2>
            <p>{userEmail}</p>
          </div>
          <div className="switch-row">
            <button className="primary-btn" onClick={onGoProfile}>View profile</button>
            <button className="secondary-btn" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-card auth-card-large">
      <div className="auth-panel">
        <div>
          <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create account'}</p>
          <h2>{mode === 'login' ? 'Log in to MarketSpace' : 'Join MarketSpace'}</h2>
          <p>Use your account to list items, save favorites, and chat with buyers and sellers.</p>
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          {mode === 'signup' ? <input value={authUsername} onChange={(event) => onAuthUsernameChange(event.target.value)} placeholder="Username" required /> : null}
          <input value={authEmail} onChange={(event) => onAuthEmailChange(event.target.value)} placeholder="Email" type="email" required />
          <input value={authPassword} onChange={(event) => onAuthPasswordChange(event.target.value)} placeholder="Password" type="password" required />
          <button className="primary-btn" type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <div className="switch-row">
          {mode === 'login' ? <button className="ghost-btn" onClick={onSwitchMode}>Need an account?</button> : <button className="ghost-btn" onClick={onSwitchMode}>Already have an account?</button>}
        </div>
      </div>
    </section>
  )
}
