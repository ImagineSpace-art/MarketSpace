import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'

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
  const [activeQueue, setActiveQueue] = useState<'applications' | 'reports'>('applications')
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [badges, setBadges] = useState<Record<string, { verifiedId: boolean; verifiedLocation: boolean; registeredBusiness: boolean }>>({})

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

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadQueue() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadQueue])
  const refreshQueue = () => {
    setLoading(true)
    void loadQueue()
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

  if (loading) return <section className="section-card"><p>Loading store applications…</p></section>

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
        <nav aria-label="Moderation queues" style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button type="button" className="secondary-btn" onClick={() => setActiveQueue('applications')}>Store applications</button>
          <button type="button" className="primary-btn" aria-current="page">Reports</button>
        </nav>
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
      <nav aria-label="Moderation queues" style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button type="button" className="primary-btn" aria-current="page">Store applications</button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setActiveQueue('reports')
            void loadReports()
          }}
        >
          Reports
        </button>
      </nav>
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
