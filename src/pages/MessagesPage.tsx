import { useMemo, useState } from 'react'
import type { ChatThread } from '../features/marketplace/useMarketplaceApp'
import './MessagesPage.css'

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

export function MessagesPage({
  chatThreads,
  activeChatId,
  canMessage,
  chatDraft,
  onSelectThread,
  onToggleMute,
  onDraftChange,
  onSendMessage
}: MessagesPageProps) {
  const [chatCategory, setChatCategory] = useState('All')
  const activeThread = chatThreads.find((thread) => thread.id === activeChatId)
  
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
    <div className="messenger-layout">
      {/* Left Pane: Sidebar */}
      <aside className="threads-sidebar">
        <div className="sidebar-header">
          <h2>Inbox</h2>
          <div className="filter-chips">
            {chatCategories.map((categoryItem) => (
              <button
                key={categoryItem}
                className={`chip ${chatCategory === categoryItem ? 'active' : ''}`}
                onClick={() => setChatCategory(categoryItem)}
              >
                {categoryItem}
              </button>
            ))}
          </div>
        </div>

        <div className="thread-list">
          {filteredThreads.length === 0 ? (
            <p className="empty-state">No chats in this category.</p>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = activeThread?.id === thread.id
              const initial = thread.participant.slice(0, 1).toUpperCase()
              return (
                <button
                  key={thread.id}
                  className={`thread-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectThread(thread.id)}
                >
                  <div className="thread-avatar">{initial}</div>
                  <div className="thread-details">
                    <div className="thread-top-row">
                      <strong>{thread.participant}</strong>
                      {thread.unread && <span className="unread-dot" />}
                    </div>
                    <span className="thread-subtitle">{thread.listingTitle}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Right Pane: Conversation Area */}
      {activeThread ? (
        <section className="conversation-pane">
          <div className="conversation-header">
            <div className="conversation-info">
              <strong>{activeThread.participant}</strong>
              <p>{activeThread.listingTitle}</p>
            </div>
            <button className="action-btn" onClick={onToggleMute}>
              {canMessage ? 'Mute' : 'Unmute'}
            </button>
          </div>

          <div className="message-history">
            {activeThread.messages.map((messageItem) => (
              <div
                key={messageItem.id}
                className={`message-row ${messageItem.sender === 'me' ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  <p>{messageItem.content}</p>
                  <span className="message-time">{messageItem.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="composer-area">
            <input
              className="composer-input"
              value={chatDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Type a message..."
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSendMessage()
                }
              }}
            />
            <button className="send-btn" onClick={onSendMessage}>
              Send
            </button>
          </div>
        </section>
      ) : (
        <div className="no-chat-selected">
          <div>
            <span className="material-icons" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', textAlign: 'center', marginBottom: '8px' }}>chat</span>
            <span>Select a conversation to start messaging</span>
          </div>
        </div>
      )}
    </div>
  )
}