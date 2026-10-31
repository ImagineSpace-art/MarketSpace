import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import type { Listing } from '../types'

type PendingListing = Listing & {
  moderation_status: 'pending'
  moderation_reason: string | null
  store_name: string | null
}

type ReviewApplication = {
  id: string
  shop_name: string
  description: string
  category: string
  address: string
  whatsapp: string
  subdomain: string
  store_type: string
  business_registration_number: string | null
  identity: {
    legal_name: string
    date_of_birth: string
    residential_address: string
    id_image_url: string | null
    selfie_url: string | null
  } | null
  location: { proof_url: string | null; code_text: string; verification_method: 'photo' | 'video' } | null
  payout: { account_holder_name: string; payout_method: string } | null
  checks: { flagged: boolean; results: Record<string, unknown> } | null
}

type StoreReport = {
  id: string
  reason: 'scam_or_fake_store' | 'prohibited_items' | 'misleading_information' | 'impersonation' | 'other'
  details: string
  created_at: string
}

type StoreReportGroup = {
  store: { id: string; shop_name: string; subdomain: string | null } | undefined
  count: number
  reports: StoreReport[]
}

type NotificationRecipient = {
  user_id: string
  username: string | null
}

const REPORT_REASON_LABELS: Record<StoreReport['reason'], string> = {
  scam_or_fake_store: 'Scam or fake store',
  prohibited_items: 'Prohibited items',
  misleading_information: 'Misleading information',
  impersonation: 'Impersonation',
  other: 'Other',
}

export function AdminStoreReviewPage() {
  const [applications, setApplications] = useState<ReviewApplication[]>([])
  const [reportGroups, setReportGroups] = useState<StoreReportGroup[]>([])
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [activeQueue, setActiveQueue] = useState<'applications' | 'reports' | 'listings' | 'notifications'>('applications')
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [listingsLoading, setListingsLoading] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [listingReasons, setListingReasons] = useState<Record<number, string>>({})
  const [badges, setBadges] = useState<Record<string, { verifiedId: boolean; verifiedLocation: boolean; registeredBusiness: boolean }>>({})
  const [recipientMode, setRecipientMode] = useState<'all' | 'selected'>('all')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientResults, setRecipientResults] = useState<NotificationRecipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<NotificationRecipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationBody, setNotificationBody] = useState('')
  const [notificationLink, setNotificationLink] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)
  const [notificationAdminStatus, setNotificationAdminStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    let active = true
    void (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        if (active) setNotificationAdminStatus('denied')
        return
      }
      const { data, error: adminError } = await supabase
        .from('store_admins')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()
      if (active) setNotificationAdminStatus(!adminError && Boolean(data) ? 'allowed' : 'denied')
    })()
    return () => { active = false }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ applications: ReviewApplication[] }>('store-registration', {
        body: { action: 'review_queue' },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else setApplications(data?.applications || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The review queue could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReports = useCallback(async () => {
    setError('')
    setReportsLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ reports: StoreReportGroup[] }>('store-report', {
        body: { action: 'open_reports' },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else setReportGroups(data?.reports || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Open store reports could not be loaded.')
    } finally {
      setReportsLoading(false)
    }
  }, [])

  const loadPendingListings = useCallback(async () => {
    setError('')
    setListingsLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ listings: PendingListing[] }>('listing-review', {
        body: { action: 'pending_listings' },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else setPendingListings(data?.listings || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Pending listings could not be loaded.')
    } finally {
      setListingsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadQueue() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadQueue])
  const refreshQueue = () => {
    setLoading(true)
    void loadQueue()
  }

  const loadNotificationRecipients = async () => {
    setError('')
    setRecipientsLoading(true)
    const query = supabase.from('public_profiles').select('user_id, username').limit(50)
    const { data, error: recipientsError } = recipientSearch.trim()
      ? await query.ilike('username', `%${recipientSearch.trim()}%`)
      : await query.order('username', { ascending: true })
    if (recipientsError) {
      setError(`Users could not be loaded: ${recipientsError.message}`)
    } else {
      setRecipientResults((data || []).filter((row): row is NotificationRecipient => Boolean(row.user_id)))
    }
    setRecipientsLoading(false)
  }

  const toggleRecipient = (recipient: NotificationRecipient) => {
    setSelectedRecipients(current => current.some(item => item.user_id === recipient.user_id)
      ? current.filter(item => item.user_id !== recipient.user_id)
      : [...current, recipient])
  }

  const sendNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (recipientMode === 'selected' && selectedRecipients.length === 0) {
      setError('Choose at least one recipient, or send to all users.')
      return
    }
    if (selectedRecipients.length > 500) {
      setError('A notification can be sent to at most 500 selected users at a time.')
      return
    }

    setSendingNotification(true)
    try {
      const { data, error: sendError } = await supabase.rpc('send_moderator_notification', {
        p_title: notificationTitle.trim(),
        p_body: notificationBody.trim(),
        p_link_url: notificationLink.trim() || null,
        p_user_ids: recipientMode === 'all' ? null : selectedRecipients.map(user => user.user_id),
      })
      if (sendError) {
        setError(`Notification could not be sent: ${sendError.message}`)
      } else {
        const recipientDescription = recipientMode === 'all'
          ? 'all users'
          : `${Number(data)} selected user${Number(data) === 1 ? '' : 's'}`
        setNotice(`Notification sent to ${recipientDescription}.`)
        setNotificationTitle('')
        setNotificationBody('')
        setNotificationLink('')
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Notification could not be sent.')
    } finally {
      setSendingNotification(false)
    }
  }

  const renderQueueNavigation = (currentQueue: typeof activeQueue) => (
    <nav aria-label="Moderation queues" className="admin-queue-navigation">
      <button type="button" className={currentQueue === 'applications' ? 'primary-btn' : 'secondary-btn'} aria-current={currentQueue === 'applications' ? 'page' : undefined} onClick={() => setActiveQueue('applications')}>Store applications</button>
      <button type="button" className={currentQueue === 'reports' ? 'primary-btn' : 'secondary-btn'} aria-current={currentQueue === 'reports' ? 'page' : undefined} onClick={() => { setActiveQueue('reports'); void loadReports() }}>Reports</button>
      <button type="button" className={currentQueue === 'listings' ? 'primary-btn' : 'secondary-btn'} aria-current={currentQueue === 'listings' ? 'page' : undefined} onClick={() => { setActiveQueue('listings'); void loadPendingListings() }}>Listings ({pendingListings.length})</button>
      {notificationAdminStatus === 'allowed' && (
        <button type="button" className={currentQueue === 'notifications' ? 'primary-btn' : 'secondary-btn'} aria-current={currentQueue === 'notifications' ? 'page' : undefined} onClick={() => setActiveQueue('notifications')}>Notifications</button>
      )}
    </nav>
  )

  const review = async (application: ReviewApplication, decision: 'approve' | 'reject') => {
    setError('')
    setNotice('')
    setWorkingId(application.id)
    const selectedBadges = badges[application.id] || {
      verifiedId: false,
      verifiedLocation: false,
      registeredBusiness: false,
    }
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ emailWarning?: string }>('store-registration', {
        body: {
          action: 'review_application',
          storeId: application.id,
          decision,
          reason: reasons[application.id] || '',
          ...selectedBadges,
        },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else {
        setNotice(data?.emailWarning || `Application ${decision === 'approve' ? 'approved' : 'rejected'}.`)
        await loadQueue()
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The review action could not be saved.')
    } finally {
      setWorkingId('')
    }
  }

  const reviewStoreReport = async (report: StoreReport, decision: 'dismiss' | 'uphold') => {
    setError('')
    setNotice('')
    setWorkingId(report.id)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ success?: boolean }>('store-report', {
        body: { action: 'review_report', reportId: report.id, decision },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else if (!data?.success) setError('The report decision could not be saved.')
      else {
        setNotice(`Report ${decision === 'dismiss' ? 'dismissed' : 'upheld'}.`)
        await loadReports()
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The report decision could not be saved.')
    } finally {
      setWorkingId('')
    }
  }

  const reviewListing = async (listing: PendingListing, decision: 'approve' | 'reject') => {
    setError('')
    setNotice('')
    setWorkingId(String(listing.id))
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{ success?: boolean }>('listing-review', {
        body: {
          action: 'review_listing',
          listingId: listing.id,
          decision,
          reason: listingReasons[listing.id] || '',
        },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else if (!data?.success) setError('The listing decision could not be saved.')
      else {
        setNotice(`Listing ${decision === 'approve' ? 'approved' : 'rejected'}.`)
        await loadPendingListings()
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The listing decision could not be saved.')
    } finally {
      setWorkingId('')
    }
  }

  if (loading) return <section className="section-card"><p>Loading store applications…</p></section>

  if (activeQueue === 'notifications') {
    if (notificationAdminStatus === 'loading') {
      return <section className="section-card"><p>Checking moderator access…</p></section>
    }
    if (notificationAdminStatus === 'denied') {
      return <section className="section-card"><p role="alert">You are not authorized to send notifications.</p></section>
    }
    return (
      <section className="admin-notifications-page">
        <header className="admin-notifications-heading">
          <div>
            <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
            <h2>Send a notification</h2>
            <p>Only moderators can publish notifications to selected users or everyone.</p>
          </div>
        </header>
        {renderQueueNavigation('notifications')}
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        <form className="admin-notification-form" onSubmit={event => void sendNotification(event)}>
          <label>
            <span>Title</span>
            <input value={notificationTitle} maxLength={120} required onChange={event => setNotificationTitle(event.target.value)} />
          </label>
          <label>
            <span>Message</span>
            <textarea value={notificationBody} maxLength={2000} rows={5} required onChange={event => setNotificationBody(event.target.value)} />
          </label>
          <label>
            <span>Optional link</span>
            <input value={notificationLink} maxLength={2048} placeholder="/browse or https://example.com" onChange={event => setNotificationLink(event.target.value)} />
          </label>
          <fieldset>
            <legend>Recipients</legend>
            <label className="admin-recipient-mode">
              <input type="radio" name="recipient-mode" checked={recipientMode === 'all'} onChange={() => setRecipientMode('all')} />
              <span>All users</span>
            </label>
            <label className="admin-recipient-mode">
              <input type="radio" name="recipient-mode" checked={recipientMode === 'selected'} onChange={() => setRecipientMode('selected')} />
              <span>Specific users</span>
            </label>
          </fieldset>
          {recipientMode === 'selected' && (
            <div className="admin-recipient-picker">
              <div className="admin-recipient-search">
                <label htmlFor="notification-recipient-search">Find users by username</label>
                <input
                  id="notification-recipient-search"
                  value={recipientSearch}
                  onChange={event => setRecipientSearch(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void loadNotificationRecipients() } }}
                />
                <button type="button" className="secondary-btn" disabled={recipientsLoading} onClick={() => void loadNotificationRecipients()}>
                  {recipientsLoading ? 'Searching…' : 'Search users'}
                </button>
              </div>
              <p>{selectedRecipients.length} selected (up to 500 per notification)</p>
              <div className="admin-recipient-results">
                {recipientResults.map(recipient => {
                  const selected = selectedRecipients.some(item => item.user_id === recipient.user_id)
                  return (
                    <label key={recipient.user_id} className="admin-recipient-option">
                      <input type="checkbox" checked={selected} onChange={() => toggleRecipient(recipient)} />
                      <span>{recipient.username || 'User'}</span>
                      <small>{recipient.user_id}</small>
                    </label>
                  )
                })}
                {!recipientResults.length && <p>Search for a username to select recipients.</p>}
              </div>
              {selectedRecipients.length > 0 && (
                <ul className="admin-selected-recipients">
                  {selectedRecipients.map(recipient => (
                    <li key={recipient.user_id}>
                      {recipient.username || recipient.user_id}
                      <button type="button" aria-label={`Remove ${recipient.username || 'selected user'}`} onClick={() => toggleRecipient(recipient)}>
                        <span className="material-icons">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="admin-notification-submit">
            <button type="submit" className="primary-btn" disabled={sendingNotification}>
              {sendingNotification ? 'Sending…' : 'Send notification'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  if (activeQueue === 'listings') {
    return (
      <section style={{ width: 'min(100%, 1100px)', margin: '0 auto', padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>MARKETSPACE MODERATION</p>
            <h2 style={{ margin: '4px 0' }}>Listing review</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{pendingListings.length} listings awaiting review</p>
          </div>
          <button type="button" className="secondary-btn" disabled={listingsLoading} onClick={() => void loadPendingListings()}>
            {listingsLoading ? 'Refreshing…' : 'Refresh listings'}
          </button>
        </header>
        {renderQueueNavigation('listings')}
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        {listingsLoading ? (
          <section className="section-card"><p>Loading pending listings…</p></section>
        ) : pendingListings.length === 0 ? (
          <section className="section-card"><p>No listings are waiting for review.</p></section>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pendingListings.map(listing => (
              <article key={listing.id} className="section-card" style={{ padding: 20 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>{listing.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {listing.seller_name || 'Seller'}{listing.store_name ? ` · ${listing.store_name}` : ' · Individual seller'}
                    </p>
                  </div>
                  <strong>{listing.category} · ZMW {listing.price}</strong>
                </header>
                <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0' }}>{listing.description}</p>
                {listing.images?.length ? (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
                    {listing.images.map((image, index) => (
                      <img key={`${listing.id}-${index}`} src={image} alt={`${listing.title} ${index + 1}`} style={{ width: 120, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                    ))}
                  </div>
                ) : null}
                <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                  <span>Review reason (required to reject)</span>
                  <textarea
                    value={listingReasons[listing.id] || ''}
                    maxLength={500}
                    rows={2}
                    onChange={event => setListingReasons(current => ({ ...current, [listing.id]: event.target.value }))}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={workingId === String(listing.id) || !listingReasons[listing.id]?.trim()}
                    onClick={() => void reviewListing(listing, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={workingId === String(listing.id)}
                    onClick={() => void reviewListing(listing, 'approve')}
                  >
                    {workingId === String(listing.id) ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  if (activeQueue === 'reports') {
    return (
      <section style={{ width: 'min(100%, 1100px)', margin: '0 auto', padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>MARKETSPACE MODERATION</p>
            <h2 style={{ margin: '4px 0' }}>Store reports</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {reportGroups.reduce((count, group) => count + group.count, 0)} open reports across {reportGroups.length} stores
            </p>
          </div>
          <button type="button" className="secondary-btn" disabled={reportsLoading} onClick={() => void loadReports()}>
            {reportsLoading ? 'Refreshing…' : 'Refresh reports'}
          </button>
        </header>
        {renderQueueNavigation('reports')}
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        {reportsLoading ? (
          <section className="section-card"><p>Loading reports…</p></section>
        ) : reportGroups.length === 0 ? (
          <section className="section-card"><p>No open store reports.</p></section>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {reportGroups.map(group => (
              <section key={group.store?.id || group.reports[0]?.id} className="section-card" style={{ padding: 18 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{group.store?.shop_name || 'Unknown store'}</h3>
                    {group.store?.subdomain && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{group.store.subdomain}</p>}
                  </div>
                  <strong>{group.count} open {group.count === 1 ? 'report' : 'reports'}</strong>
                </header>
                <div style={{ display: 'grid', gap: 12 }}>
                  {group.reports.map(report => (
                    <article key={report.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>{REPORT_REASON_LABELS[report.reason]}</strong>
                        <time dateTime={report.created_at} style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>
                          {new Date(report.created_at).toLocaleString()}
                        </time>
                      </div>
                      <p style={{ margin: '10px 0 14px', whiteSpace: 'pre-wrap' }}>
                        {report.details || 'No additional details provided.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={workingId === report.id}
                          onClick={() => void reviewStoreReport(report, 'dismiss')}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={workingId === report.id}
                          onClick={() => void reviewStoreReport(report, 'uphold')}
                        >
                          {workingId === report.id ? 'Saving…' : 'Uphold'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section style={{ width: 'min(100%, 1100px)', margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>MARKETSPACE MODERATION</p>
          <h2 style={{ margin: '4px 0' }}>Store review queue</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{applications.length} application{applications.length === 1 ? '' : 's'} waiting for review</p>
        </div>
        <button type="button" className="secondary-btn" onClick={refreshQueue}>Refresh queue</button>
      </header>
      {renderQueueNavigation('applications')}
      {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
      {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
      {!applications.length && <section className="section-card"><p>No store applications are waiting for review.</p></section>}

      <div style={{ display: 'grid', gap: 18 }}>
        {applications.map((application) => {
          const selectedBadges = badges[application.id] || {
            verifiedId: false,
            verifiedLocation: false,
            registeredBusiness: Boolean(application.business_registration_number),
          }
          const checks = application.checks?.results || {}
          return (
            <article key={application.id} className="section-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{application.shop_name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {application.subdomain}.marketspace · {application.store_type.replace('_', ' ')} · {application.category}
                  </p>
                </div>
                <strong style={{ color: application.checks?.flagged ? '#d97706' : '#059669' }}>
                  {application.checks?.flagged ? 'Flagged for manual checks' : 'Automated checks passed'}
                </strong>
              </div>

              <p>{application.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
                <section>
                  <h4>Owner identity</h4>
                  <p>{application.identity?.legal_name || 'Missing'} · DOB {application.identity?.date_of_birth || '—'}</p>
                  <p>{application.identity?.residential_address || 'No residential address'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {application.identity?.id_image_url && <img src={application.identity.id_image_url} alt="Government ID submitted for verification" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: '#0b1220', borderRadius: 8 }} />}
                    {application.identity?.selfie_url && <img src={application.identity.selfie_url} alt="Owner selfie submitted for verification" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: '#0b1220', borderRadius: 8 }} />}
                  </div>
                </section>
                <section>
                  <h4>Store and location</h4>
                  <p>{application.address}</p>
                  <p>Support: {application.whatsapp}</p>
                  {application.location?.verification_method === 'video'
                    ? <p>Owner requested a reviewer video call for location verification.</p>
                    : application.location?.proof_url
                    ? <>
                      <p>One-time code shown on proof: <strong>{application.location.code_text}</strong></p>
                      <img src={application.location.proof_url} alt="Private location verification photo" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#0b1220', borderRadius: 8 }} />
                    </>
                    : <p>No location proof photo; arrange video call or request resubmission.</p>}
                </section>
                <section>
                  <h4>Payout name</h4>
                  <p>{application.payout?.account_holder_name || 'Missing'} · {application.payout?.payout_method || '—'}</p>
                  <h4>Automated checks</h4>
                  <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '.77rem' }}>{JSON.stringify(checks, null, 2)}</pre>
                </section>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '16px 0' }}>
                {([
                  ['verifiedId', 'Verified ID'],
                  ['verifiedLocation', 'Verified location'],
                  ['registeredBusiness', 'Registered business'],
                ] as const).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={selectedBadges[key]} onChange={(event) => setBadges((current) => ({
                      ...current,
                      [application.id]: { ...selectedBadges, [key]: event.target.checked },
                    }))} />
                    {label}
                  </label>
                ))}
              </div>
              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                Review reason (required for approval or rejection)
                <textarea rows={2} value={reasons[application.id] || ''} onChange={(event) => setReasons((current) => ({ ...current, [application.id]: event.target.value }))} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="secondary-btn" disabled={workingId === application.id} onClick={() => void review(application, 'reject')}>
                  Reject with reason
                </button>
                <button type="button" className="primary-btn" disabled={workingId === application.id} onClick={() => void review(application, 'approve')}>
                  {workingId === application.id ? 'Saving…' : 'Approve store'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
