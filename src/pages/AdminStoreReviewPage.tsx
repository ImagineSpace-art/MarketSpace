import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminSupabase } from '../lib/adminSupabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import type { BusinessAd, Listing } from '../types'
import { AdminOverview } from './AdminOverview'

export type AdminSection = 'overview' | 'applications' | 'reports' | 'listings' | 'ads' | 'seller-verifications' | 'boosts' | 'notifications' | 'audit'

type AdminOutletContext = {
  role: 'moderator' | 'admin'
  activeSection: AdminSection
  onNavigate: (section: AdminSection) => void
}

type PendingListing = Listing & {
  moderation_status: 'pending'
  moderation_reason: string | null
  store_name: string | null
}

type PendingAd = BusinessAd & {
  moderation_status: 'pending'
  moderation_reason: string | null
  user_id: string
  store_name: string
  seller_name: string
}

type PendingSellerVerification = {
  user_id: string
  seller_name: string
  submitted_at: string | null
  id_image_url: string
  selfie_url: string
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

type AuditEvent = {
  created_at: string
  source: string
  entity_type: string
  entity_id: string
  actor_user_id: string | null
  action: string
  reason: string | null
  details: Record<string, unknown>
}

const REPORT_REASON_LABELS: Record<StoreReport['reason'], string> = {
  scam_or_fake_store: 'Scam or fake store',
  prohibited_items: 'Prohibited items',
  misleading_information: 'Misleading information',
  impersonation: 'Impersonation',
  other: 'Other',
}

type AdminBoost = {
  id: string
  target_type: 'listing' | 'ad' | 'store'
  target_id: string
  target_title: string | null
  owner_id: string
  reach_percent: number
  starts_at: string
  ends_at: string
  location_id: string | null
  status: string
  end_reason: string | null
  impressions: number
  clicks: number
  notification_sent_at: string | null
  created_at: string
}

export function AdminStoreReviewPage() {
  const { activeSection, onNavigate } = useOutletContext<AdminOutletContext>()
  const [applications, setApplications] = useState<ReviewApplication[]>([])
  const [reportGroups, setReportGroups] = useState<StoreReportGroup[]>([])
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([])
  const [pendingSellerVerifications, setPendingSellerVerifications] = useState<PendingSellerVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [listingsLoading, setListingsLoading] = useState(false)
  const [adsLoading, setAdsLoading] = useState(false)
  const [sellerVerificationsLoading, setSellerVerificationsLoading] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [listingReasons, setListingReasons] = useState<Record<number, string>>({})
  const [adReasons, setAdReasons] = useState<Record<string, string>>({})
  const [sellerVerificationReasons, setSellerVerificationReasons] = useState<Record<string, string>>({})
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
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [boostRows, setBoostRows] = useState<AdminBoost[]>([])
  const [boostsLoading, setBoostsLoading] = useState(false)
  const [moderatorUserId, setModeratorUserId] = useState('')

  useEffect(() => {
    let active = true
    void (async () => {
      const { data: userData, error: userError } = await adminSupabase.auth.getUser()
      if (userError || !userData.user) {
        if (active) setNotificationAdminStatus('denied')
        return
      }
      if (active) setModeratorUserId(userData.user.id)
      const { data, error: adminError } = await adminSupabase
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ applications: ReviewApplication[] }>('store-registration', {
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ reports: StoreReportGroup[] }>('store-report', {
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ listings: PendingListing[] }>('listing-review', {
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

  const loadPendingAds = useCallback(async () => {
    setError('')
    setAdsLoading(true)
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ ads: PendingAd[] }>('listing-review', {
        body: { action: 'pending_ads' },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else setPendingAds(data?.ads || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Pending ads could not be loaded.')
    } finally {
      setAdsLoading(false)
    }
  }, [])

  const loadPendingSellerVerifications = useCallback(async () => {
    setError('')
    setSellerVerificationsLoading(true)
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{
        verifications: PendingSellerVerification[]
      }>('seller-verification', { body: { action: 'pending_reviews' } })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else setPendingSellerVerifications(data?.verifications || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Identity verification queue could not be loaded.')
    } finally {
      setSellerVerificationsLoading(false)
    }
  }, [])

  const loadAudit = useCallback(async () => {
    setError('')
    setAuditLoading(true)
    const { data, error: auditError } = await adminSupabase.rpc('get_moderation_audit_log')
    if (auditError) setError(`Audit history could not be loaded: ${auditError.message}`)
    else setAuditEvents((data || []) as AuditEvent[])
    setAuditLoading(false)
  }, [])

  const loadBoosts = useCallback(async () => {
    setError('')
    setBoostsLoading(true)
    try {
      const { data, error: boostError } = await adminSupabase.rpc('list_admin_visibility_boosts')
      if (boostError) setError(`Boost metrics could not be loaded: ${boostError.message}`)
      else setBoostRows((data || []) as AdminBoost[])
    } catch (boostError) {
      setError(boostError instanceof Error ? boostError.message : 'Boost metrics could not be loaded.')
    } finally {
      setBoostsLoading(false)
    }
  }, [])

  const sendBoostExpirationNotice = async (boostId: string) => {
    setError('')
    setNotice('')
    setWorkingId(boostId)
    try {
      const { error: sendError } = await adminSupabase.rpc('send_boost_expiration_notification', {
        p_boost_id: boostId,
      })
      if (sendError) throw new Error(sendError.message)
      setNotice('The prewritten boost-expiration notification was sent to the owner.')
      await loadBoosts()
    } catch (sendError) {
      setError(`Boost expiration notification could not be sent: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`)
    } finally {
      setWorkingId('')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadQueue() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadQueue])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([loadReports(), loadPendingListings(), loadPendingAds(), loadPendingSellerVerifications()])
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadReports, loadPendingListings, loadPendingAds, loadPendingSellerVerifications])
  const refreshQueue = () => {
    setLoading(true)
    void loadQueue()
  }

  const loadNotificationRecipients = async () => {
    setError('')
    setRecipientsLoading(true)
    const query = adminSupabase.from('public_profiles').select('user_id, username').limit(50)
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
      const { data, error: sendError } = await adminSupabase.rpc('send_moderator_notification', {
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ emailWarning?: string }>('store-registration', {
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ success?: boolean }>('store-report', {
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
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ success?: boolean }>('listing-review', {
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

  const reviewAd = async (ad: PendingAd, decision: 'approve' | 'reject') => {
    setError('')
    setNotice('')
    setWorkingId(ad.id)
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ success?: boolean }>('listing-review', {
        body: {
          action: 'review_ad',
          adId: ad.id,
          decision,
          reason: adReasons[ad.id] || '',
        },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else if (!data?.success) setError('The ad decision could not be saved.')
      else {
        setNotice(`Ad ${decision === 'approve' ? 'approved' : 'rejected'}.`)
        await loadPendingAds()
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The ad decision could not be saved.')
    } finally {
      setWorkingId('')
    }
  }

  const reviewSellerVerification = async (verification: PendingSellerVerification, decision: 'approve' | 'reject') => {
    setError('')
    setNotice('')
    setWorkingId(verification.user_id)
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ success?: boolean }>(
        'seller-verification',
        {
          body: {
            action: 'review',
            userId: verification.user_id,
            decision,
            reason: sellerVerificationReasons[verification.user_id] || '',
          },
        },
      )
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else if (!data?.success) setError('The identity review decision could not be saved.')
      else {
        setNotice(`Identity verification ${decision === 'approve' ? 'approved' : 'rejected'}.`)
        setSellerVerificationReasons(current => {
          const next = { ...current }
          delete next[verification.user_id]
          return next
        })
        await loadPendingSellerVerifications()
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The identity review decision could not be saved.')
    } finally {
      setWorkingId('')
    }
  }

  const navigateToSection = (section: AdminSection) => {
    onNavigate(section)
    if (section === 'applications') void loadQueue()
    else if (section === 'reports') void loadReports()
    else if (section === 'listings') void loadPendingListings()
    else if (section === 'ads') void loadPendingAds()
    else if (section === 'seller-verifications') void loadPendingSellerVerifications()
    else if (section === 'boosts') void loadBoosts()
    else if (section === 'audit') void loadAudit()
  }

  if (activeSection === 'overview') return <AdminOverview onNavigate={navigateToSection} />
  if (loading) return <section className="section-card"><p>Loading store applications…</p></section>

  if (activeSection === 'notifications') {
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

  if (activeSection === 'boosts') {
    return (
      <section className="admin-queue-page">
        <header className="admin-queue-heading">
          <div>
            <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
            <h2>Visibility boosts</h2>
            <p>Review boost reach, impressions, clicks, end times, and owner notification status.</p>
          </div>
          <button type="button" className="secondary-btn" disabled={boostsLoading} onClick={() => void loadBoosts()}>
            {boostsLoading ? 'Refreshing…' : 'Refresh boosts'}
          </button>
        </header>
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        {boostsLoading ? (
          <section className="section-card"><p>Loading boosts…</p></section>
        ) : boostRows.length === 0 ? (
          <section className="section-card"><p>No visibility boosts have been created.</p></section>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {boostRows.map(boost => {
              const expired = boost.status === 'ended' && boost.end_reason === 'expired'
              const clickRate = boost.impressions > 0
                ? `${((boost.clicks / boost.impressions) * 100).toFixed(1)}%`
                : '—'
              return (
                <article className="section-card" key={boost.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>{boost.target_title || `${boost.target_type} (removed)`}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {boost.target_type} · {boost.reach_percent}% audience · {boost.location_id || 'All locations'}
                    </p>
                    <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
                      Owner {boost.owner_id} · {new Date(boost.starts_at).toLocaleString()} – {new Date(boost.ends_at).toLocaleString()}
                    </p>
                    <strong>{boost.impressions} impressions · {boost.clicks} clicks · {clickRate} click-through</strong>
                    <p style={{ margin: '4px 0 0' }}>
                      Status: {expired ? 'Expired' : boost.status === 'ended' ? 'Ended early' : 'Active'}
                      {boost.end_reason === 'target_unavailable' ? ' · Target no longer approved/active' : ''}
                    </p>
                  </div>
                  <div>
                    {expired && !boost.notification_sent_at ? (
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={workingId === boost.id}
                        onClick={() => void sendBoostExpirationNotice(boost.id)}
                      >
                        {workingId === boost.id ? 'Sending…' : 'Send expiration notice'}
                      </button>
                    ) : (
                      <span role="status">{boost.notification_sent_at ? `Notice sent ${new Date(boost.notification_sent_at).toLocaleString()}` : 'No notice due yet'}</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  if (activeSection === 'audit') {
    return (
      <section className="admin-queue-page">
        <header className="admin-queue-heading">
          <div>
            <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
            <h2>Audit log</h2>
            <p>Read-only history of store applications, reports, listings, and ads.</p>
          </div>
          <button type="button" className="secondary-btn" disabled={auditLoading} onClick={() => void loadAudit()}>
            {auditLoading ? 'Refreshing…' : 'Refresh audit log'}
          </button>
        </header>
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {auditLoading ? (
          <section className="section-card"><p>Loading audit history…</p></section>
        ) : auditEvents.length === 0 ? (
          <section className="section-card"><p>No audit events have been recorded.</p></section>
        ) : (
          <div className="admin-audit-list">
            {auditEvents.map((event, index) => (
              <article className="admin-audit-row" key={`${event.source}-${event.created_at}-${event.entity_id}-${index}`}>
                <div>
                  <strong>{event.action.replaceAll('_', ' ')}</strong>
                  <span>{event.entity_type.replaceAll('_', ' ')} · {event.entity_id}</span>
                  <small>{event.source.replaceAll('_', ' ')} · Actor {event.actor_user_id || 'system'}</small>
                  {event.reason && <p>{event.reason}</p>}
                </div>
                <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  if (activeSection === 'listings') {
    return (
      <section style={{ width: 'min(100%, 1100px)', boxSizing: 'border-box', margin: '0 auto', padding: 20 }}>
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
                    {listing.user_id === moderatorUserId && <p role="note" style={{ margin: '5px 0 0', color: '#b45309' }}>You cannot review your own listing.</p>}
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
                    disabled={listing.user_id === moderatorUserId || workingId === String(listing.id) || !listingReasons[listing.id]?.trim()}
                    onClick={() => void reviewListing(listing, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={listing.user_id === moderatorUserId || workingId === String(listing.id)}
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

  if (activeSection === 'seller-verifications') {
    return (
      <section style={{ width: 'min(100%, 1100px)', boxSizing: 'border-box', margin: '0 auto', padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>MARKETSPACE MODERATION</p>
            <h2 style={{ margin: '4px 0' }}>Individual seller identity review</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{pendingSellerVerifications.length} submissions awaiting review</p>
          </div>
          <button type="button" className="secondary-btn" disabled={sellerVerificationsLoading} onClick={() => void loadPendingSellerVerifications()}>
            {sellerVerificationsLoading ? 'Refreshing…' : 'Refresh identity checks'}
          </button>
        </header>
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        {sellerVerificationsLoading ? (
          <section className="section-card"><p>Loading identity submissions…</p></section>
        ) : pendingSellerVerifications.length === 0 ? (
          <section className="section-card"><p>No individual seller identities are waiting for review.</p></section>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pendingSellerVerifications.map(verification => {
              const isOwnVerification = verification.user_id === moderatorUserId
              const isWorking = workingId === verification.user_id
              const reason = sellerVerificationReasons[verification.user_id] || ''
              return (
                <article key={verification.user_id} className="section-card" style={{ padding: 20 }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px' }}>{verification.seller_name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Individual seller · {verification.user_id}</p>
                    </div>
                    <time dateTime={verification.submitted_at || undefined} style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>
                      Submitted {verification.submitted_at ? new Date(verification.submitted_at).toLocaleString() : 'date unavailable'}
                    </time>
                  </header>
                  {isOwnVerification && <p role="note">You cannot review your own identity verification.</p>}
                  <p style={{ color: 'var(--text-secondary)' }}>Private image links expire after 10 minutes. Refresh this queue to renew them.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
                    <figure style={{ margin: 0, minWidth: 0 }}>
                      <figcaption style={{ marginBottom: 6, fontWeight: 700 }}>ID document</figcaption>
                      <img
                        src={verification.id_image_url}
                        alt={`ID document submitted by ${verification.seller_name}`}
                        referrerPolicy="no-referrer"
                        style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}
                      />
                    </figure>
                    <figure style={{ margin: 0, minWidth: 0 }}>
                      <figcaption style={{ marginBottom: 6, fontWeight: 700 }}>Seller selfie</figcaption>
                      <img
                        src={verification.selfie_url}
                        alt={`Seller selfie submitted by ${verification.seller_name}`}
                        referrerPolicy="no-referrer"
                        style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}
                      />
                    </figure>
                  </div>
                  <label style={{ display: 'grid', gap: 6, marginTop: 16 }}>
                    Rejection reason (required to reject; max 500 characters)
                    <textarea
                      value={reason}
                      maxLength={500}
                      rows={3}
                      onChange={event => setSellerVerificationReasons(current => ({
                        ...current,
                        [verification.user_id]: event.target.value,
                      }))}
                    />
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={isOwnVerification || isWorking || !reason.trim()}
                      onClick={() => void reviewSellerVerification(verification, 'reject')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isOwnVerification || isWorking}
                      onClick={() => void reviewSellerVerification(verification, 'approve')}
                    >
                      {isWorking ? 'Saving…' : 'Approve'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  if (activeSection === 'ads') {
    return (
      <section style={{ width: 'min(100%, 1100px)', boxSizing: 'border-box', margin: '0 auto', padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>MARKETSPACE MODERATION</p>
            <h2 style={{ margin: '4px 0' }}>Ad review</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{pendingAds.length} ads awaiting review</p>
          </div>
          <button type="button" className="secondary-btn" disabled={adsLoading} onClick={() => void loadPendingAds()}>
            {adsLoading ? 'Refreshing…' : 'Refresh ads'}
          </button>
        </header>
        {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
        {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
        {adsLoading ? (
          <section className="section-card"><p>Loading pending ads…</p></section>
        ) : pendingAds.length === 0 ? (
          <section className="section-card"><p>No ads are waiting for review.</p></section>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {pendingAds.map(ad => (
              <article key={ad.id} className="section-card" style={{ padding: 20, minWidth: 0 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', overflowWrap: 'anywhere' }}>{ad.headline || ad.adTitle || 'Untitled ad'}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{ad.seller_name} · {ad.store_name}</p>
                    {ad.user_id === moderatorUserId && <p role="note" style={{ margin: '5px 0 0', color: '#b45309' }}>You cannot review your own ad.</p>}
                  </div>
                  <strong>{ad.status} · {ad.budget}</strong>
                </header>
                {ad.adText && <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0' }}>{ad.adText}</p>}
                {ad.media?.length ? (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
                    {ad.media.map((source, index) => ad.mediaTypes?.[index] === 'video'
                      ? <video key={`${ad.id}-${index}`} src={source} controls preload="metadata" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8, flex: '0 0 auto' }} />
                      : <img key={`${ad.id}-${index}`} src={source} alt={`${ad.headline || ad.adTitle || 'Ad'} ${index + 1}`} style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8, flex: '0 0 auto' }} />)}
                  </div>
                ) : null}
                <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                  <span>Review reason (required to reject)</span>
                  <textarea
                    value={adReasons[ad.id] || ''}
                    maxLength={500}
                    rows={2}
                    onChange={event => setAdReasons(current => ({ ...current, [ad.id]: event.target.value }))}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={ad.user_id === moderatorUserId || workingId === ad.id || !adReasons[ad.id]?.trim()}
                    onClick={() => void reviewAd(ad, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={ad.user_id === moderatorUserId || workingId === ad.id}
                    onClick={() => void reviewAd(ad, 'approve')}
                  >
                    {workingId === ad.id ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  if (activeSection === 'reports') {
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
