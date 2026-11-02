import { useCallback, useEffect, useState } from 'react'
import { adminSupabase } from '../lib/adminSupabaseClient'
import type { AdminSection } from './AdminStoreReviewPage'

type DashboardTotals = {
  users: number
  listings: number
  active_listings: number
  pending_listings: number
  stores: number
  approved_stores: number
  pending_store_applications: number
  open_reports: number
  pending_ads: number
  pending_seller_verifications: number
  events_last_30_days: number
}

type TrendDay = {
  date: string
  signups: number
  listings: number
  views: number
  engagements: number
}

type DashboardOverviewData = {
  generated_at: string
  totals: DashboardTotals
  trend: TrendDay[]
}

function isDashboardOverviewData(value: unknown): value is DashboardOverviewData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<DashboardOverviewData>
  const totals = data.totals
  return typeof data.generated_at === 'string'
    && totals !== undefined
    && Object.keys(EMPTY_TOTALS).every(key => {
      const count = totals[key as keyof DashboardTotals]
      return typeof count === 'number' && Number.isFinite(count)
    })
    && Array.isArray(data.trend)
    && data.trend.every(day => day
      && typeof day.date === 'string'
      && ['signups', 'listings', 'views', 'engagements'].every(key => {
        const count = day[key as keyof TrendDay]
        return typeof count === 'number' && Number.isFinite(count)
      }))
}

type AdminOverviewProps = {
  onNavigate: (section: AdminSection) => void
}

const EMPTY_TOTALS: DashboardTotals = {
  users: 0,
  listings: 0,
  active_listings: 0,
  pending_listings: 0,
  stores: 0,
  approved_stores: 0,
  pending_store_applications: 0,
  open_reports: 0,
  pending_ads: 0,
  pending_seller_verifications: 0,
  events_last_30_days: 0,
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function chartPoints(values: number[], width = 640, height = 190) {
  const maximum = Math.max(1, ...values)
  const step = width / Math.max(values.length - 1, 1)
  return values.map((value, index) => ({
    x: index * step,
    y: height - (value / maximum) * (height - 16) - 8,
  }))
}

function TrendChart({ title, description, days, metric }: {
  title: string
  description: string
  days: TrendDay[]
  metric: keyof Omit<TrendDay, 'date'>
}) {
  const values = days.map(day => day[metric])
  const points = chartPoints(values)
  const line = points.map(point => `${point.x},${point.y}`).join(' ')
  const area = `${points[0]?.x ?? 0},190 ${line} ${points.at(-1)?.x ?? 640},190`
  const peak = Math.max(0, ...values)

  return (
    <section className="admin-dashboard-chart" aria-label={`${title}: ${description}`}>
      <header>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <strong>{formatNumber(values.reduce((sum, value) => sum + value, 0))}</strong>
      </header>
      <div className="admin-chart-canvas">
        <svg viewBox="0 0 640 200" role="img" aria-label={`${title} over the last 14 days. Peak daily count ${peak}.`}>
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity=".22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map(row => {
            const y = 8 + row * 58
            return <line key={row} x1="0" x2="640" y1={y} y2={y} className="admin-chart-gridline" />
          })}
          {points.length > 1 && <polygon points={area} fill={`url(#fill-${metric})`} />}
          {points.length > 1 && <polyline points={line} className="admin-chart-line" />}
          {points.map((point, index) => (
            <circle key={days[index].date} cx={point.x} cy={point.y} r="3.5" className="admin-chart-dot">
              <title>{`${new Date(`${days[index].date}T12:00:00`).toLocaleDateString()}: ${values[index]}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <footer>
        <span>{days[0] ? new Date(`${days[0].date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</span>
        <span>Last 14 days</span>
        <span>{days.at(-1) ? new Date(`${days.at(-1)?.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</span>
      </footer>
    </section>
  )
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: overviewError } = await adminSupabase.rpc('get_admin_dashboard_overview')
    if (overviewError) {
      setError(`Dashboard metrics could not be loaded: ${overviewError.message}`)
    } else if (!isDashboardOverviewData(data)) {
      setError('Dashboard metrics could not be loaded: the response format was invalid.')
    } else {
      setOverview(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOverview() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadOverview])

  const totals = overview?.totals ?? EMPTY_TOTALS
  const moderationItems: Array<{ label: string; count: number; section: AdminSection; icon: string }> = [
    { label: 'Store applications', count: totals.pending_store_applications, section: 'applications', icon: 'storefront' },
    { label: 'Listing reviews', count: totals.pending_listings, section: 'listings', icon: 'inventory_2' },
    { label: 'Ad reviews', count: totals.pending_ads, section: 'ads', icon: 'campaign' },
    { label: 'Identity checks', count: totals.pending_seller_verifications, section: 'seller-verifications', icon: 'verified_user' },
    { label: 'Open reports', count: totals.open_reports, section: 'reports', icon: 'flag' },
  ]

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div>
          <p className="admin-eyebrow">MARKETSPACE OPERATIONS</p>
          <h1>Platform overview</h1>
          <p>A live snapshot of marketplace activity and moderation workload.</p>
        </div>
        <div className="admin-dashboard-refresh">
          {overview?.generated_at && <span>Updated {new Date(overview.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" className="secondary-btn" disabled={loading} onClick={() => void loadOverview()}>
            <span className="material-icons" aria-hidden="true">refresh</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="admin-dashboard-error">{error}</p>}

      <section className="admin-dashboard-metrics" aria-label="Platform totals">
        <article className="admin-dashboard-metric">
          <span className="admin-dashboard-metric-icon blue"><span className="material-icons" aria-hidden="true">group</span></span>
          <div><span>Total users</span><strong>{loading ? '—' : formatNumber(totals.users)}</strong><small>Registered marketplace accounts</small></div>
        </article>
        <article className="admin-dashboard-metric">
          <span className="admin-dashboard-metric-icon violet"><span className="material-icons" aria-hidden="true">inventory_2</span></span>
          <div><span>Active listings</span><strong>{loading ? '—' : formatNumber(totals.active_listings)}</strong><small>{formatNumber(totals.pending_listings)} waiting for review</small></div>
        </article>
        <article className="admin-dashboard-metric">
          <span className="admin-dashboard-metric-icon green"><span className="material-icons" aria-hidden="true">storefront</span></span>
          <div><span>Approved stores</span><strong>{loading ? '—' : formatNumber(totals.approved_stores)}</strong><small>{formatNumber(totals.pending_store_applications)} applications pending</small></div>
        </article>
        <article className="admin-dashboard-metric">
          <span className="admin-dashboard-metric-icon orange"><span className="material-icons" aria-hidden="true">insights</span></span>
          <div><span>Tracked activity</span><strong>{loading ? '—' : formatNumber(totals.events_last_30_days)}</strong><small>Events in the last 30 days</small></div>
        </article>
      </section>

      <section className="admin-dashboard-chart-grid" aria-label="Performance trends">
        {loading && !overview ? (
          <div className="admin-dashboard-loading">Loading platform trends…</div>
        ) : overview?.trend?.length ? (
          <>
              <TrendChart title="New users" description="Account registrations per day" days={overview.trend} metric="signups" />
              <TrendChart title="New listings" description="Listing submissions per day" days={overview.trend} metric="listings" />
              <TrendChart title="Marketplace views" description="Store and listing views per day" days={overview.trend} metric="views" />
              <TrendChart title="Customer engagement" description="Clicks, saves, shares and inquiries per day" days={overview.trend} metric="engagements" />
            </>
        ) : (
          <div className="admin-dashboard-loading">No trend data is available yet.</div>
        )}
      </section>

      <section className="admin-dashboard-lower-grid">
        <div className="admin-dashboard-panel">
          <header>
            <div><h2>Needs attention</h2><p>Items currently waiting for moderator action.</p></div>
            <span className="admin-dashboard-total">{moderationItems.reduce((sum, item) => sum + item.count, 0)} open</span>
          </header>
          <div className="admin-dashboard-queue-list">
            {moderationItems.map(item => (
              <button key={item.section} type="button" onClick={() => onNavigate(item.section)}>
                <span className="material-icons" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                <strong>{formatNumber(item.count)}</strong>
                <span className="material-icons admin-dashboard-arrow" aria-hidden="true">chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-dashboard-panel">
          <header>
            <div><h2>Marketplace health</h2><p>Current content and platform totals.</p></div>
          </header>
          <dl className="admin-dashboard-health">
            <div><dt>Total listings</dt><dd>{loading ? '—' : formatNumber(totals.listings)}</dd></div>
            <div><dt>Total stores</dt><dd>{loading ? '—' : formatNumber(totals.stores)}</dd></div>
            <div><dt>Pending store ads</dt><dd>{loading ? '—' : formatNumber(totals.pending_ads)}</dd></div>
            <div><dt>Pending seller checks</dt><dd>{loading ? '—' : formatNumber(totals.pending_seller_verifications)}</dd></div>
          </dl>
        </div>
      </section>
    </main>
  )
}
