import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminSupabase } from '../lib/adminSupabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import type { BusinessAd, Listing } from '../types'
import { AdminOverview } from './AdminOverview'
import { AdminAnnouncementsPage } from './AdminAnnouncementsPage'
import { AdminTermsPage } from './AdminTermsPage'
import { AdminBusinessVerificationPage } from './AdminBusinessVerificationPage'

export type AdminSection = 'overview' | 'applications' | 'reports' | 'listings' | 'ads' | 'seller-verifications' | 'business-verification' | 'boosts' | 'notifications' | 'announcements' | 'audit' | 'terms'

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
  created_at: string
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
  created_at: string
  shop_name: string
  description: string
  category: string
  address: string
  customer_care: { email?: string; phone?: string } | null
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
  location: { proof_url: string | null; verification_method: 'photo' | 'video' } | null
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

type ReviewStoreReport = StoreReport & {
  store: StoreReportGroup['store']
  store_report_count: number
}

function sortOldestFirst<T>(items: T[], getDate: (item: T) => string | null | undefined) {
  return [...items].sort((left, right) => {
    const leftTimestamp = Date.parse(getDate(left) || '')
    const rightTimestamp = Date.parse(getDate(right) || '')
    const leftValid = Number.isFinite(leftTimestamp)
    const rightValid = Number.isFinite(rightTimestamp)
    if (!leftValid && !rightValid) return 0
    if (!leftValid) return 1
    if (!rightValid) return -1
    return leftTimestamp - rightTimestamp
  })
}

function AdminReviewSplitLayout<T>({
  queueName,
  items,
  selectedId,
  onSelect,
  onBack,
  getId,
  renderListItem,
  renderDetails,
}: {
  queueName: string
  items: T[]
  selectedId: string
  onSelect: (id: string) => void
  onBack: () => void
  getId: (item: T) => string
  renderListItem: (item: T, isSelected: boolean) => ReactNode
  renderDetails: (item: T) => ReactNode
}) {
  const selectedItem = items.find(item => getId(item) === selectedId)
  return (
    <div className={`admin-application-review${selectedItem ? ' has-selected-application' : ''}`}>
      <div className="admin-application-workspace">
        <aside className="admin-application-list" aria-label={`${queueName} awaiting review`}>
          <div className="admin-application-list-items">
            {items.length > 0 ? items.map(item => {
              const id = getId(item)
              const isSelected = id === selectedId
              return (
                <button
                  type="button"
                  key={id}
                  className={`admin-application-list-item${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(id)}
                >
                  {renderListItem(item, isSelected)}
                </button>
              )
            }) : (
              <p className="admin-application-list-empty">No items are waiting for review.</p>
            )}
          </div>
        </aside>
        <div className="admin-application-detail">
          {selectedItem ? (
            <article className="section-card admin-application-card">
              <button type="button" className="admin-application-back" onClick={onBack}>
                <span aria-hidden="true">←</span> All {queueName.toLowerCase()}
              </button>
              {renderDetails(selectedItem)}
            </article>
          ) : (
            <section className="section-card admin-application-detail-empty">
              <h3>{items.length ? `Select a ${queueName.toLowerCase()} to review` : `No ${queueName.toLowerCase()} waiting`}</h3>
              <p>{items.length ? `Choose an item from the list to inspect its details and make a decision.` : `There are no ${queueName.toLowerCase()} in this queue.`}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

type NotificationRecipient = {
  user_id: string
  username: string | null
}

const AUTOMATIC_NOTIFICATION_TEMPLATES = [
  {
    trigger: 'Listing expires',
    title: 'Listing expired',
    body: 'Your listing “[listing title]” has expired and is no longer visible to shoppers. Renew it from your seller dashboard when you are ready.',
  },
  {
    trigger: 'Store application approved',
    title: 'Store application approved',
    body: 'Your store application for “[store name]” has been approved, but your store will not be hosted until you finish business verification from your seller dashboard.',
  },
  {
    trigger: 'Store application denied',
    title: 'Store application not approved',
    body: 'Your store application for “[store name]” was not approved. Review the feedback in your store dashboard and update your application to try again.',
  },
  {
    trigger: 'Listing approved',
    title: 'Listing approved',
    body: 'Your listing “[listing title]” is now live.',
  },
  {
    trigger: 'Listing rejected',
    title: 'Listing rejected',
    body: 'Your listing “[listing title]” was rejected. The moderation reason is included in your notification.',
  },
  {
    trigger: 'Store ad reviewed',
    title: 'Ad approved or rejected',
    body: 'Store ad decisions include a notification with the ad title and, when rejected, the moderation reason.',
  },
]

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
  const { activeSection, onNavigate, role } = useOutletContext<AdminOutletContext>()
  const [applications, setApplications] = useState<ReviewApplication[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [applicationSearch, setApplicationSearch] = useState('')
  const [reportGroups, setReportGroups] = useState<StoreReportGroup[]>([])
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([])
  const [pendingSellerVerifications, setPendingSellerVerifications] = useState<PendingSellerVerification[]>([])
  const [selectedListingId, setSelectedListingId] = useState('')
  const [selectedAdId, setSelectedAdId] = useState('')
  const [selectedSellerVerificationId, setSelectedSellerVerificationId] = useState('')
  const [selectedReportId, setSelectedReportId] = useState('')
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

  const oldestApplications = sortOldestFirst(applications, application => application.created_at)
  const oldestListings = sortOldestFirst(pendingListings, listing => listing.created_at)
  const oldestAds = sortOldestFirst(pendingAds, ad => ad.created_at)
  const oldestSellerVerifications = sortOldestFirst(
    pendingSellerVerifications,
    verification => verification.submitted_at,
  )
  const oldestReports: ReviewStoreReport[] = sortOldestFirst(
    reportGroups.flatMap(group => group.reports.map(report => ({
      ...report,
      store: group.store,
      store_report_count: group.count,
    }))),
    report => report.created_at,
  )
  const filteredApplications = oldestApplications.filter(application => {
    const query = applicationSearch.trim().toLocaleLowerCase()
    if (!query) return true
    return [
      application.shop_name,
      application.subdomain,
      application.category,
      application.identity?.legal_name,
    ].some(value => value?.toLocaleLowerCase().includes(query))
  })
  const selectedApplication = applications.find(application => application.id === selectedApplicationId) || null
  const application = selectedApplication
  const selectedBadges = selectedApplication
    ? badges[selectedApplication.id] || {
      verifiedId: false,
      verifiedLocation: false,
      registeredBusiness: Boolean(selectedApplication.business_registration_number),
    }
    : null
  const selectedChecks = selectedApplication?.checks?.results || {}

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
      else {
        const nextApplications = sortOldestFirst(data?.applications || [], application => application.created_at)
        setApplications(nextApplications)
        setSelectedApplicationId(current => nextApplications.some(application => application.id === current)
          ? current
          : nextApplications[0]?.id || '')
      }
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
      else {
        const nextGroups = data?.reports || []
        const nextReports = sortOldestFirst(
          nextGroups.flatMap(group => group.reports),
          report => report.created_at,
        )
        setReportGroups(nextGroups)
        setSelectedReportId(current => nextReports.some(report => report.id === current)
          ? current
          : nextReports[0]?.id || '')
      }
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
      else {
        const nextListings = sortOldestFirst(data?.listings || [], listing => listing.created_at)
        setPendingListings(nextListings)
        setSelectedListingId(current => nextListings.some(listing => String(listing.id) === current)
          ? current
          : String(nextListings[0]?.id || ''))
      }
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
      else {
        const nextAds = sortOldestFirst(data?.ads || [], ad => ad.created_at)
        setPendingAds(nextAds)
        setSelectedAdId(current => nextAds.some(ad => ad.id === current)
          ? current
          : nextAds[0]?.id || '')
      }
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
      else {
        const nextVerifications = sortOldestFirst(
          data?.verifications || [],
          verification => verification.submitted_at,
        )
        setPendingSellerVerifications(nextVerifications)
        setSelectedSellerVerificationId(current => nextVerifications.some(verification => verification.user_id === current)
          ? current
          : nextVerifications[0]?.user_id || '')
      }
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

  const deleteReportedStoreForFraud = async (storeId: string, storeName: string) => {
    if (!window.confirm(`Permanently remove "${storeName}" for confirmed fraud or abuse? The owner will be blocked from registering another store.`)) return
    setError('')
    setNotice('')
    setWorkingId(storeId)
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ success?: boolean }>('store-deletion', {
        body: {
          action: 'delete_for_fraud',
          storeId,
          reason: 'Fraud or abuse confirmed by a MarketSpace moderator.',
        },
      })
      if (invokeError) setError(await getFunctionErrorMessage(invokeError))
      else if (!data?.success) setError('The reported store could not be removed.')
      else {
        setNotice('Store and store-owned data were removed. The owner and identity hashes are blocked from store re-registration.')
        await loadReports()
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The reported store could not be removed.')
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
  if (activeSection === 'terms') return <AdminTermsPage role={role} />
  if (activeSection === 'announcements') return <AdminAnnouncementsPage />
  if (activeSection === 'business-verification') return <AdminBusinessVerificationPage />
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
        <section className="admin-automatic-notification-templates" aria-labelledby="automatic-notifications-heading">
          <div>
            <h3 id="automatic-notifications-heading">Automatic notification templates</h3>
            <p>These prewritten messages are sent by MarketSpace when the matching event occurs.</p>
          </div>
          <div className="admin-automatic-notification-grid">
            {AUTOMATIC_NOTIFICATION_TEMPLATES.map(template => (
              <article key={template.trigger}>
                <strong>{template.trigger}</strong>
                <span>{template.title}</span>
                <p>{template.body}</p>
              </article>
            ))}
          </div>
        </section>
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
        ) : (
          <AdminReviewSplitLayout
            queueName="Listings"
            items={oldestListings}
            selectedId={selectedListingId}
            onSelect={setSelectedListingId}
            onBack={() => setSelectedListingId('')}
            getId={listing => String(listing.id)}
            renderListItem={listing => (
              <>
                <span className="admin-application-list-title">{listing.title}</span>
                <span className="admin-application-list-meta">
                  {listing.seller_name || 'Seller'} · {listing.store_name || 'Individual seller'}
                </span>
                <span className="admin-application-list-meta">{listing.category} · ZMW {listing.price}</span>
                <span className="admin-application-list-meta">
                  Submitted {listing.created_at ? new Date(listing.created_at).toLocaleString() : 'date unavailable'}
                </span>
              </>
            )}
            renderDetails={listing => {
              const isOwnListing = listing.user_id === moderatorUserId
              const isWorking = workingId === String(listing.id)
              return (
                <>
                  <div className="admin-application-detail-heading">
                    <div>
                      <p className="admin-eyebrow">LISTING DETAILS</p>
                      <h3>{listing.title}</h3>
                      <p>{listing.seller_name || 'Seller'} · {listing.store_name || 'Individual seller'} · {listing.category}</p>
                    </div>
                    <strong>ZMW {listing.price}</strong>
                  </div>
                  {listing.created_at && <p>Submitted {new Date(listing.created_at).toLocaleString()}</p>}
                  {isOwnListing && <p role="note">You cannot review your own listing.</p>}
                  <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
                  {listing.images?.length ? (
                    <div className="admin-review-media-list">
                      {listing.images.map((image, index) => (
                        <img key={`${listing.id}-${index}`} src={image} alt={`${listing.title} ${index + 1}`} />
                      ))}
                    </div>
                  ) : <p>No listing images provided.</p>}
                  <label className="admin-application-review-reason">
                    Review reason (required to reject)
                    <textarea
                      value={listingReasons[listing.id] || ''}
                      maxLength={500}
                      rows={3}
                      onChange={event => setListingReasons(current => ({ ...current, [listing.id]: event.target.value }))}
                    />
                  </label>
                  <div className="admin-application-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={isOwnListing || isWorking || !listingReasons[listing.id]?.trim()}
                      onClick={() => void reviewListing(listing, 'reject')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isOwnListing || isWorking}
                      onClick={() => void reviewListing(listing, 'approve')}
                    >
                      {isWorking ? 'Saving…' : 'Approve'}
                    </button>
                  </div>
                </>
              )
            }}
          />
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
        ) : (
          <AdminReviewSplitLayout
            queueName="Identity checks"
            items={oldestSellerVerifications}
            selectedId={selectedSellerVerificationId}
            onSelect={setSelectedSellerVerificationId}
            onBack={() => setSelectedSellerVerificationId('')}
            getId={verification => verification.user_id}
            renderListItem={verification => (
              <>
                <span className="admin-application-list-title">{verification.seller_name}</span>
                <span className="admin-application-list-meta">Individual seller</span>
                <span className="admin-application-list-meta">
                  Submitted {verification.submitted_at ? new Date(verification.submitted_at).toLocaleString() : 'date unavailable'}
                </span>
              </>
            )}
            renderDetails={verification => {
              const isOwnVerification = verification.user_id === moderatorUserId
              const isWorking = workingId === verification.user_id
              const reason = sellerVerificationReasons[verification.user_id] || ''
              return (
                <>
                  <div className="admin-application-detail-heading">
                    <div>
                      <p className="admin-eyebrow">IDENTITY CHECK DETAILS</p>
                      <h3>{verification.seller_name}</h3>
                      <p>Individual seller · {verification.user_id}</p>
                    </div>
                    <time dateTime={verification.submitted_at || undefined}>
                      Submitted {verification.submitted_at ? new Date(verification.submitted_at).toLocaleString() : 'date unavailable'}
                    </time>
                  </div>
                  {isOwnVerification && <p role="note">You cannot review your own identity verification.</p>}
                  <p className="admin-review-muted">Private image links expire after 10 minutes. Refresh this queue to renew them.</p>
                  <div className="admin-review-media-grid">
                    <figure>
                      <figcaption>ID document</figcaption>
                      <img
                        src={verification.id_image_url}
                        alt={`ID document submitted by ${verification.seller_name}`}
                        referrerPolicy="no-referrer"
                      />
                    </figure>
                    <figure>
                      <figcaption>Seller selfie</figcaption>
                      <img
                        src={verification.selfie_url}
                        alt={`Seller selfie submitted by ${verification.seller_name}`}
                        referrerPolicy="no-referrer"
                      />
                    </figure>
                  </div>
                  <label className="admin-application-review-reason">
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
                  <div className="admin-application-actions">
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
                </>
              )
            }}
          />
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
        ) : (
          <AdminReviewSplitLayout
            queueName="Store ads"
            items={oldestAds}
            selectedId={selectedAdId}
            onSelect={setSelectedAdId}
            onBack={() => setSelectedAdId('')}
            getId={ad => ad.id}
            renderListItem={ad => (
              <>
                <span className="admin-application-list-title">{ad.headline || ad.adTitle || 'Untitled ad'}</span>
                <span className="admin-application-list-meta">{ad.seller_name} · {ad.store_name}</span>
                <span className="admin-application-list-meta">{ad.status} · {ad.budget}</span>
                <span className="admin-application-list-meta">Submitted {new Date(ad.created_at).toLocaleString()}</span>
              </>
            )}
            renderDetails={ad => {
              const isOwnAd = ad.user_id === moderatorUserId
              const isWorking = workingId === ad.id
              const adTitle = ad.headline || ad.adTitle || 'Untitled ad'
              return (
                <>
                  <div className="admin-application-detail-heading">
                    <div>
                      <p className="admin-eyebrow">STORE AD DETAILS</p>
                      <h3>{adTitle}</h3>
                      <p>{ad.seller_name} · {ad.store_name}</p>
                    </div>
                    <strong>{ad.status} · {ad.budget}</strong>
                  </div>
                  <p>Submitted {new Date(ad.created_at).toLocaleString()}</p>
                  {isOwnAd && <p role="note">You cannot review your own ad.</p>}
                  {ad.adText && <p style={{ whiteSpace: 'pre-wrap' }}>{ad.adText}</p>}
                  {ad.media?.length ? (
                    <div className="admin-review-media-list">
                      {ad.media.map((source, index) => ad.mediaTypes?.[index] === 'video'
                        ? <video key={`${ad.id}-${index}`} src={source} controls preload="metadata" />
                        : <img key={`${ad.id}-${index}`} src={source} alt={`${adTitle} ${index + 1}`} />)}
                    </div>
                  ) : <p>No ad media provided.</p>}
                  <label className="admin-application-review-reason">
                    Review reason (required to reject)
                    <textarea
                      value={adReasons[ad.id] || ''}
                      maxLength={500}
                      rows={3}
                      onChange={event => setAdReasons(current => ({ ...current, [ad.id]: event.target.value }))}
                    />
                  </label>
                  <div className="admin-application-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={isOwnAd || isWorking || !adReasons[ad.id]?.trim()}
                      onClick={() => void reviewAd(ad, 'reject')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isOwnAd || isWorking}
                      onClick={() => void reviewAd(ad, 'approve')}
                    >
                      {isWorking ? 'Saving…' : 'Approve'}
                    </button>
                  </div>
                </>
              )
            }}
          />
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
        ) : (
          <AdminReviewSplitLayout
            queueName="Reports"
            items={oldestReports}
            selectedId={selectedReportId}
            onSelect={setSelectedReportId}
            onBack={() => setSelectedReportId('')}
            getId={report => report.id}
            renderListItem={report => (
              <>
                <span className="admin-application-list-title">{report.store?.shop_name || 'Unknown store'}</span>
                <span className="admin-application-list-meta">{REPORT_REASON_LABELS[report.reason]}</span>
                <span className="admin-application-list-meta">
                  {report.details || 'No additional details provided.'}
                </span>
                <span className="admin-application-list-meta">Submitted {new Date(report.created_at).toLocaleString()}</span>
              </>
            )}
            renderDetails={report => {
              const isWorking = workingId === report.id
              const isRemovingStore = Boolean(report.store && workingId === report.store.id)
              return (
                <>
                  <div className="admin-application-detail-heading">
                    <div>
                      <p className="admin-eyebrow">STORE REPORT DETAILS</p>
                      <h3>{REPORT_REASON_LABELS[report.reason]}</h3>
                      <p>{report.store?.shop_name || 'Unknown store'}{report.store?.subdomain ? ` · ${report.store.subdomain}` : ''}</p>
                    </div>
                    <strong>{report.store_report_count} open {report.store_report_count === 1 ? 'report' : 'reports'}</strong>
                  </div>
                  <time dateTime={report.created_at}>Submitted {new Date(report.created_at).toLocaleString()}</time>
                  <p className="admin-review-report-details">{report.details || 'No additional details provided.'}</p>
                  <div className="admin-application-actions admin-review-report-actions">
                    {report.store && (
                      <button
                        type="button"
                        className="danger-btn compact-btn"
                        disabled={workingId === report.store.id}
                        onClick={() => void deleteReportedStoreForFraud(report.store!.id, report.store!.shop_name)}
                      >
                        {isRemovingStore ? 'Removing…' : 'Remove store for fraud / abuse'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={isWorking}
                      onClick={() => void reviewStoreReport(report, 'dismiss')}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isWorking}
                      onClick={() => void reviewStoreReport(report, 'uphold')}
                    >
                      {isWorking ? 'Saving…' : 'Uphold'}
                    </button>
                  </div>
                </>
              )
            }}
          />
        )}
      </section>
    )
  }

  return (
    <section className={`admin-application-review${selectedApplication ? ' has-selected-application' : ''}`}>
      <header className="admin-application-heading">
        <div>
          <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
          <h2>Store applications</h2>
          <p>{applications.length} application{applications.length === 1 ? '' : 's'} waiting for review</p>
        </div>
        <button type="button" className="secondary-btn" disabled={loading} onClick={refreshQueue}>
          {loading ? 'Refreshing…' : 'Refresh queue'}
        </button>
      </header>
      {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
      {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
      {loading ? (
        <section className="section-card"><p>Loading store applications…</p></section>
      ) : !applications.length ? (
        <section className="section-card"><p>No store applications are waiting for review.</p></section>
      ) : (
        <div className="admin-application-workspace">
          <aside className="admin-application-list" aria-label="Applications awaiting review">
            <label className="admin-application-search">
              <span>Find an application</span>
              <input
                type="search"
                value={applicationSearch}
                onChange={event => setApplicationSearch(event.target.value)}
                placeholder="Store, owner, category…"
              />
            </label>
            <p className="admin-application-list-count">
              Showing {filteredApplications.length} of {applications.length}
            </p>
            <div className="admin-application-list-items">
              {filteredApplications.map(application => (
                <button
                  type="button"
                  key={application.id}
                  className={`admin-application-list-item${application.id === selectedApplicationId ? ' is-selected' : ''}`}
                  aria-pressed={application.id === selectedApplicationId}
                  onClick={() => setSelectedApplicationId(application.id)}
                >
                  <span className="admin-application-list-title">{application.shop_name}</span>
                  <span className="admin-application-list-meta">
                    {application.identity?.legal_name || 'Owner not provided'}
                  </span>
                  <span className="admin-application-list-meta">
                    {application.category} · {application.store_type.replaceAll('_', ' ')}
                  </span>
                  <span className="admin-application-list-meta">
                    Submitted {new Date(application.created_at).toLocaleString()}
                  </span>
                  <span className={`admin-application-status${application.checks?.flagged ? ' is-flagged' : ''}`}>
                    {application.checks?.flagged ? 'Manual checks' : 'Checks passed'}
                  </span>
                </button>
              ))}
              {filteredApplications.length === 0 && (
                <p className="admin-application-list-empty">No applications match that search.</p>
              )}
            </div>
          </aside>

          <div className="admin-application-detail">
          {application && selectedBadges ? (
            <article className="section-card admin-application-card">
              <button
                type="button"
                className="admin-application-back"
                onClick={() => setSelectedApplicationId('')}
              >
                <span aria-hidden="true">←</span> All applications
              </button>
              <div className="admin-application-detail-heading">
                <div>
                  <p className="admin-eyebrow">APPLICATION DETAILS</p>
                  <h3>{application.shop_name}</h3>
                  <p>{application.subdomain}.marketspace · {application.store_type.replaceAll('_', ' ')} · {application.category} · Submitted {new Date(application.created_at).toLocaleString()}</p>
                </div>
                <strong className={application.checks?.flagged ? 'is-flagged' : 'is-passed'}>
                  {application.checks?.flagged ? 'Flagged for manual checks' : 'Automated checks passed'}
                </strong>
              </div>

              <p>{application.description}</p>
              <div className="admin-application-evidence">
                <section>
                  <h4>Owner identity</h4>
                  <p>{application.identity?.legal_name || 'Missing'} · DOB {application.identity?.date_of_birth || '—'}</p>
                  <p>{application.identity?.residential_address || 'No residential address'}</p>
                  <div className="admin-application-identity-images">
                    {application.identity?.id_image_url && <img src={application.identity.id_image_url} alt="Government ID submitted for verification" />}
                    {application.identity?.selfie_url && <img src={application.identity.selfie_url} alt="Owner selfie submitted for verification" />}
                  </div>
                </section>
                <section>
                  <h4>Store and location</h4>
                  <p>{application.address}</p>
                  <p>Support: {[application.customer_care?.email, application.customer_care?.phone].filter(Boolean).join(' · ') || 'Not provided'}</p>
                  {application.location?.verification_method === 'video'
                    ? <p>Owner requested a reviewer video call for location verification.</p>
                    : application.location?.proof_url
                    ? <>
                      <p>Review the photo against the declared store address and marketplace location.</p>
                      <img className="admin-application-location-image" src={application.location.proof_url} alt="Private location verification photo" />
                    </>
                    : <p>No location proof photo; arrange video call or request resubmission.</p>}
                </section>
                <section>
                  <h4>Automated checks</h4>
                  <pre>{JSON.stringify(selectedChecks, null, 2)}</pre>
                </section>
              </div>

              <div className="admin-application-badges">
                {([
                  ['verifiedId', 'Verified ID'],
                  ['verifiedLocation', 'Verified location'],
                  ['registeredBusiness', 'Registered business'],
                ] as const).map(([key, label]) => (
                  <label key={key}>
                    <input type="checkbox" checked={selectedBadges[key]} onChange={(event) => setBadges((current) => ({
                      ...current,
                      [application.id]: { ...selectedBadges, [key]: event.target.checked },
                    }))} />
                    {label}
                  </label>
                ))}
              </div>
              <label className="admin-application-review-reason">
                Review reason (required for approval or rejection)
                <textarea rows={2} value={reasons[application.id] || ''} onChange={(event) => setReasons((current) => ({ ...current, [application.id]: event.target.value }))} />
              </label>
              <div className="admin-application-actions">
                <button type="button" className="secondary-btn" disabled={workingId === application.id} onClick={() => void review(application, 'reject')}>
                  Reject with reason
                </button>
                <button type="button" className="primary-btn" disabled={workingId === application.id} onClick={() => void review(application, 'approve')}>
                  {workingId === application.id ? 'Saving…' : 'Approve store'}
                </button>
              </div>
            </article>
          ) : (
            <section className="section-card admin-application-detail-empty">
              <h3>Select an application to review</h3>
              <p>Choose an application from the list to inspect its details and make a decision.</p>
            </section>
          )}
          </div>
        </div>
      )}
    </section>
  )
}
