import { useMemo, useState } from 'react'
import type { ChatThread } from '../features/marketplace/useMarketplaceApp'

function renderMessageContent(content: string) {
  if (content.startsWith('[INQUIRY_CARD]')) {
    try {
      const jsonStr = content.replace('[INQUIRY_CARD]', '')
      const data = JSON.parse(jsonStr) as {
        listingId?: number
        title?: string
        price?: number
        image?: string
        colors?: string[]
        size?: string | null
        quantity?: number
        phone?: string
        message?: string | null
        offer?: number | null
        isService?: boolean
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: 'var(--panel, #f8fafc)', borderRadius: '14px', minWidth: '260px', maxWidth: '380px', color: 'var(--text, #0f172a)', border: '1px solid var(--border, rgba(0,0,0,0.1))', boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>
                {data.isService ? 'handyman' : 'inventory_2'}
              </span>
              <strong style={{ fontSize: '0.86rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {data.isService ? 'Service Inquiry' : 'Listing Inquiry'}
              </strong>
            </div>
            {data.offer ? (
              <span style={{ fontSize: '0.72rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                Offer Attached
              </span>
            ) : null}
          </div>

          {/* Product Mini Preview */}
          {(data.title || data.price != null) && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--surface, #ffffff)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              {data.image ? (
                <img src={data.image} alt={data.title || 'Product'} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span className="material-icons" style={{ fontSize: '20px', color: 'var(--text-secondary, #64748b)' }}>photo_library</span>
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {data.title || 'Listing'}
                </div>
                {data.price != null && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                    Listed: <strong style={{ color: '#2563eb' }}>ZMW {data.price.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structured Attributes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {data.colors && data.colors.length > 0 && (
              <div style={{ background: 'var(--surface, #ffffff)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', display: 'block' }}>Color(s)</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {data.colors.map((c) => (
                    <span key={c} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(0,0,0,0.2)' }} title={c} />
                  ))}
                </div>
              </div>
            )}

            {data.size && (
              <div style={{ background: 'var(--surface, #ffffff)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', display: 'block' }}>Size</span>
                <strong style={{ fontSize: '0.82rem', marginTop: '2px', display: 'block' }}>{data.size}</strong>
              </div>
            )}

            <div style={{ background: 'var(--surface, #ffffff)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', display: 'block' }}>Quantity</span>
              <strong style={{ fontSize: '0.82rem', marginTop: '2px', display: 'block' }}>{data.quantity || 1}</strong>
            </div>

            {data.phone && (
              <div style={{ background: 'var(--surface, #ffffff)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', display: 'block' }}>Phone</span>
                <a href={`tel:${data.phone}`} style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                  <span className="material-icons" style={{ fontSize: '13px' }}>call</span>
                  {data.phone}
                </a>
              </div>
            )}
          </div>

          {/* Offer Highlight */}
          {data.offer != null && data.offer > 0 && (
            <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)' }}>Proposed Offer:</span>
              <strong style={{ fontSize: '0.9rem', color: '#2563eb' }}>ZMW {Number(data.offer).toLocaleString()}</strong>
            </div>
          )}

          {/* Customer Message */}
          {data.message && (
            <div style={{ background: 'var(--surface, #ffffff)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-icons" style={{ fontSize: '12px' }}>chat_bubble_outline</span>
                Note from buyer
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', lineHeight: '1.4', fontStyle: 'italic', color: 'var(--text, #0f172a)' }}>
                "{data.message}"
              </p>
            </div>
          )}
        </div>
      )
    } catch (e) {
      return <p style={{ margin: 0 }}>{content}</p>
    }
  }

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

  const [sidebarWidth, setSidebarWidth] = useState(340)
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(540, moveEvent.clientX - 20))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className={`messenger-layout ${activeThread ? 'has-active-thread' : 'no-active-thread'}`}>
      {/* Left Pane: Sidebar */}
      <aside className="threads-sidebar" style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
        <div className="sidebar-header">
          <h2>Inbox</h2>
          <div className="filter-chips" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
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

      {/* Draggable Resizer Handle */}
      <div
        className="resizer-handle desktop-only"
        onMouseDown={handleMouseDown}
        title="Drag to resize inbox sidebar width"
        style={{
          width: '6px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
          transition: 'background-color 0.2s',
          zIndex: 10,
          flexShrink: 0
        }}
      />

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