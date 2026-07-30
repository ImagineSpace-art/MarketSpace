import { useMemo, useState } from 'react'
import type { ChatThread } from '../features/marketplace/useMarketplaceApp'

function renderMessageContent(content: string) {
  if (content.startsWith('[ORDER_CARD]')) {
    try {
      const jsonStr = content.replace('[ORDER_CARD]', '')
      const data = JSON.parse(jsonStr) as {
        colors?: string[]
        quantity: number
        deliveryOption: string
        phone: string
        location: string
        isService?: boolean
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--panel)', borderRadius: '12px', minWidth: '240px', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '4px' }}>
            <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>
              {data.isService ? 'build' : 'shopping_cart'}
            </span>
            <strong style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {data.isService ? 'Service Booking Request' : 'Purchase Offer Details'}
            </strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.colors && data.colors.length > 0 && (
              <div style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Selected Colors</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {data.colors.map(color => (
                    <span key={color} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: color, border: '1px solid rgba(0,0,0,0.2)' }} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Quantity</span>
              <strong style={{ fontSize: '0.82rem' }}>{data.quantity}</strong>
            </div>

            <div style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Delivery / Service Option</span>
              <strong style={{ fontSize: '0.82rem' }}>{data.deliveryOption}</strong>
            </div>

            <div style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Buyer Location / Address</span>
              <strong style={{ fontSize: '0.82rem' }}>{data.location || 'Not provided'}</strong>
            </div>

            <div style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Buyer Mobile Number</span>
              <strong style={{ fontSize: '0.82rem' }}>{data.phone || 'Not provided'}</strong>
            </div>
          </div>
        </div>
      )
    } catch (e) {
      return <p style={{ margin: 0 }}>{content}</p>
    }
  }

  return <p style={{ margin: 0 }}>{content}</p>
}

type MessagesPageProps = {
  chatThreads: ChatThread[]
  activeChatId: number | null
  canMessage: boolean
  chatDraft: string
  onSelectThread: (threadId: number) => void
  onToggleMute: () => void
  onDraftChange: (value: string) => void
  onSendMessage: () => void
  onTogglePinChat?: (chatId: number) => void
  onToggleFavoriteChat?: (chatId: number) => void
  onToggleArchiveChat?: (chatId: number) => void
  onDeleteChat?: (chatId: number) => void
}

export function MessagesPage({
  chatThreads,
  activeChatId,
  canMessage,
  chatDraft,
  onSelectThread,
  onToggleMute,
  onDraftChange,
  onSendMessage,
  onTogglePinChat,
  onToggleFavoriteChat,
  onToggleArchiveChat,
  onDeleteChat,
}: MessagesPageProps) {
  const [chatCategory, setChatCategory] = useState('All')
  const activeThread = chatThreads.find((thread) => thread.id === activeChatId)
  
  const chatCategories = ['All', 'Unread', 'Pinned', 'Favorites', 'Archived']
  
  const filteredThreads = useMemo(() => {
    if (chatCategory === 'Unread') {
      return chatThreads.filter((thread) => thread.unread && !thread.isArchived)
    }
    if (chatCategory === 'Pinned') {
      return chatThreads.filter((thread) => thread.isPinned && !thread.isArchived)
    }
    if (chatCategory === 'Favorites') {
      return chatThreads.filter((thread) => thread.isFavorite && !thread.isArchived)
    }
    if (chatCategory === 'Archived') {
      return chatThreads.filter((thread) => thread.isArchived)
    }
    return chatThreads.filter((thread) => !thread.isArchived)
  }, [chatCategory, chatThreads])

  return (
    <div className={`messenger-layout ${activeThread ? 'has-active-thread' : 'no-active-thread'}`}>
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
                <div
                  key={thread.id}
                  className={`thread-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectThread(thread.id)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div className="thread-avatar">{initial}</div>
                    <div className="thread-details" style={{ overflow: 'hidden' }}>
                      <div className="thread-top-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.participant}</strong>
                        {thread.unread && <span className="unread-dot" />}
                      </div>
                      <span className="thread-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {thread.listingTitle}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn-compact"
                      title={thread.isPinned ? "Unpin Chat" : "Pin Chat"}
                      onClick={() => onTogglePinChat?.(thread.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: thread.isPinned ? 'var(--primary)' : 'var(--text-muted)', padding: '2px 4px' }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>{thread.isPinned ? 'push_pin' : 'pin_invoke'}</span>
                    </button>
                    <button
                      className="icon-btn-compact"
                      title={thread.isFavorite ? "Remove Favorite" : "Favorite Chat"}
                      onClick={() => onToggleFavoriteChat?.(thread.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: thread.isFavorite ? '#f59e0b' : 'var(--text-muted)', padding: '2px 4px' }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>{thread.isFavorite ? 'star' : 'star_border'}</span>
                    </button>
                    <button
                      className="icon-btn-compact"
                      title={thread.isArchived ? "Unarchive Chat" : "Archive Chat"}
                      onClick={() => onToggleArchiveChat?.(thread.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: thread.isArchived ? '#10b981' : 'var(--text-muted)', padding: '2px 4px' }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>{thread.isArchived ? 'unarchive' : 'archive'}</span>
                    </button>
                    <button
                      className="icon-btn-compact"
                      title="Delete Chat"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this chat thread?')) {
                          onDeleteChat?.(thread.id)
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px' }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* Right Pane: Conversation Area */}
      {activeThread ? (
        <section className="conversation-pane">
          <div className="conversation-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-back-btn"
              onClick={() => onSelectThread(0)}
              title="Back to Inbox"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <span className="material-icons">arrow_back</span>
            </button>
            <div className="conversation-info" style={{ flex: 1 }}>
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
                  {renderMessageContent(messageItem.content)}
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