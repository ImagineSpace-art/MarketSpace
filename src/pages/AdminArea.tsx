import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { TurnstileCaptcha } from '../components/TurnstileCaptcha'
import { adminSupabase } from '../lib/adminSupabaseClient'
import { supabase } from '../lib/supabaseClient'
import { AdminStoreReviewPage, type AdminSection } from './AdminStoreReviewPage'
import './AdminArea.css'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_DENIED_MESSAGE = 'The code could not be verified. Request a new code and try again.'
const SEPARATE_ACCOUNT_MESSAGE = 'Use a different account for moderator access than the account currently signed in to MarketSpace.'
type LoginResponse = {
  success: boolean
  message?: string
  session?: { access_token: string; refresh_token: string }
}

async function usesSeparateAccount(moderatorUserId: string) {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('The active MarketSpace account could not be checked.')
  return data.session?.user.id !== moderatorUserId
}

function NotFoundPage() {
  return (
    <main className="marketspace-not-found">
      <span className="material-icons" aria-hidden="true">search_off</span>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or may have moved.</p>
      <a href="/">Return to MarketSpace</a>
    </main>
  )
}

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaGeneration, setCaptchaGeneration] = useState(0)
  const [codeRequested, setCodeRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const receiveCaptchaToken = useCallback((token: string) => setCaptchaToken(token), [])

  useEffect(() => {
    let active = true
    void adminSupabase.auth.getSession().then(async ({ data, error }) => {
      if (!active || error || !data.session) return
      const { data: moderator, error: roleError } = await adminSupabase.rpc('is_moderator')
      if (!active || roleError || moderator !== true) return
      try {
        if (await usesSeparateAccount(data.session.user.id)) {
          navigate('/admin', { replace: true })
        } else {
          setError(SEPARATE_ACCOUNT_MESSAGE)
        }
      } catch (accountError) {
        setError(accountError instanceof Error ? accountError.message : 'The active MarketSpace account could not be checked.')
      }
    })
    return () => { active = false }
  }, [navigate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!TURNSTILE_SITE_KEY) {
      setError('Moderator sign-in is unavailable because CAPTCHA is not configured.')
      return
    }
    if (!captchaToken) {
      setError('Complete the CAPTCHA challenge to continue.')
      return
    }

    setBusy(true)
    try {
      if (!codeRequested) {
        const { data, error: invokeError } = await supabase.functions.invoke<LoginResponse>('admin-auth', {
          body: { action: 'request', email: email.trim(), captchaToken },
        })
        if (invokeError) throw new Error('The one-time code request could not be completed. Try again shortly.')
        setMessage(data?.message || 'If the address is eligible, a one-time code has been sent.')
        setCodeRequested(true)
      } else {
        const { data, error: invokeError } = await supabase.functions.invoke<LoginResponse>('admin-auth', {
          body: { action: 'verify', email: email.trim(), code: code.trim(), captchaToken },
        })
        if (invokeError || !data?.success || !data.session?.access_token || !data.session.refresh_token) {
          setError(data?.message || SESSION_DENIED_MESSAGE)
          setCaptchaGeneration(value => value + 1)
          setCaptchaToken('')
          return
        }

        const { data: sessionData, error: sessionError } = await adminSupabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (sessionError) throw new Error('The moderator session could not be established.')
        if (!sessionData.session || !await usesSeparateAccount(sessionData.session.user.id)) {
          await adminSupabase.auth.signOut()
          setError(SEPARATE_ACCOUNT_MESSAGE)
          setCaptchaGeneration(value => value + 1)
          setCaptchaToken('')
          return
        }
        const { data: moderator, error: roleError } = await adminSupabase.rpc('is_moderator')
        if (roleError || moderator !== true) {
          await adminSupabase.auth.signOut()
          setError(SESSION_DENIED_MESSAGE)
          setCaptchaGeneration(value => value + 1)
          setCaptchaToken('')
          return
        }
        navigate('/admin', { replace: true })
      }
      setCaptchaGeneration(value => value + 1)
      setCaptchaToken('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Moderator sign-in could not be completed.')
      setCaptchaGeneration(value => value + 1)
      setCaptchaToken('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand"><span className="material-icons">shield</span> MarketSpace Operations</div>
        <p className="admin-eyebrow">MODERATOR ACCESS</p>
        <h1>{codeRequested ? 'Enter your one-time code' : 'Sign in to moderation'}</h1>
        <p className="admin-login-description">
          {codeRequested
            ? 'Enter the six-digit code sent to your eligible email address.'
            : 'Moderators sign in with an email-confirmed account. No new account is created.'}
        </p>
        <form onSubmit={submit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              required
              disabled={codeRequested || busy}
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          {codeRequested && (
            <label>
              <span>6-digit code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
          )}
          <TurnstileCaptcha key={captchaGeneration} onToken={receiveCaptchaToken} />
          {message && <p className="admin-login-notice" role="status">{message}</p>}
          {error && <p className="admin-login-error" role="alert">{error}</p>}
          <button type="submit" className="admin-login-submit" disabled={busy || !captchaToken}>
            {busy ? 'Please wait…' : codeRequested ? 'Verify and sign in' : 'Send one-time code'}
          </button>
          {codeRequested && (
            <button type="button" className="admin-login-secondary" disabled={busy} onClick={() => {
              setCodeRequested(false)
              setCode('')
              setMessage('')
              setError('')
              setCaptchaToken('')
              setCaptchaGeneration(value => value + 1)
            }}>
              Use a different email
            </button>
          )}
        </form>
      </section>
    </main>
  )
}

function AdminGate() {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking')
  const [role, setRole] = useState<'moderator' | 'admin'>('moderator')

  useEffect(() => {
    let active = true
    let latestCheck = 0
    const check = async (session: Session | null) => {
      const checkId = ++latestCheck
      if (!session) {
        if (active) setStatus('denied')
        return
      }
      try {
        if (!await usesSeparateAccount(session.user.id)) {
          if (active && checkId === latestCheck) setStatus('denied')
          return
        }
        const [{ data: moderator, error: moderatorError }, { data: assignment, error: assignmentError }] = await Promise.all([
          adminSupabase.rpc('is_moderator'),
          adminSupabase.from('store_admins').select('role').eq('user_id', session.user.id).maybeSingle(),
        ])
        if (!active || checkId !== latestCheck) return
        if (moderatorError || assignmentError || moderator !== true || !assignment) {
          setStatus('denied')
          return
        }
        setRole(assignment.role === 'admin' ? 'admin' : 'moderator')
        setStatus('allowed')
      } catch {
        if (active && checkId === latestCheck) setStatus('denied')
      }
    }

    const reloadAdminSession = async () => {
      const { data, error } = await adminSupabase.auth.getSession()
      if (error) {
        setStatus('denied')
        return
      }
      void check(data.session)
    }

    void adminSupabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (active) setStatus('denied')
        return
      }
      void check(data.session)
    })
    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange((_event, session) => {
      void check(session)
    })
    const { data: { subscription: shopperSubscription } } = supabase.auth.onAuthStateChange(() => {
      void reloadAdminSession()
    })
    return () => {
      active = false
      subscription.unsubscribe()
      shopperSubscription.unsubscribe()
    }
  }, [])

  if (status === 'checking') {
    return <main className="admin-gate-loading" aria-label="Loading">Loading…</main>
  }
  if (status === 'denied') return <NotFoundPage />
  return <AdminLayout role={role} />
}

function AdminLayout({ role }: { role: 'moderator' | 'admin' }) {
  const navigate = useNavigate()
  const timer = useRef<number | undefined>(undefined)
  const lastActivity = useRef(0)
  const [signOutError, setSignOutError] = useState('')
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')

  useEffect(() => {
    const signOutForInactivity = async () => {
      const { error } = await adminSupabase.auth.signOut()
      if (error) {
        setSignOutError('Automatic sign-out failed. Please sign out manually.')
        timer.current = window.setTimeout(signOutForInactivity, 60_000)
        return
      }
      navigate('/admin/login', { replace: true, state: { reason: 'idle' } })
    }
    const resetTimer = () => {
      const now = Date.now()
      if (now - lastActivity.current < 1000) return
      lastActivity.current = now
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(signOutForInactivity, IDLE_TIMEOUT_MS)
    }
    timer.current = window.setTimeout(signOutForInactivity, IDLE_TIMEOUT_MS)
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }))
    return () => {
      window.clearTimeout(timer.current)
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [navigate])

  const signOut = async () => {
    const { error } = await adminSupabase.auth.signOut()
    if (error) {
      setSignOutError('Sign-out failed. Please try again.')
      return
    }
    navigate('/admin/login', { replace: true })
  }

  const navigateToSection = (section: AdminSection) => setActiveSection(section)

  const navigationGroups: Array<{ label: string; items: Array<{ section: AdminSection; title: string; icon: string }> }> = [
    { label: 'WORKSPACE', items: [{ section: 'overview', title: 'Overview', icon: 'space_dashboard' }] },
    {
      label: 'MODERATION',
      items: [
        { section: 'applications', title: 'Store applications', icon: 'storefront' },
        { section: 'listings', title: 'Listings', icon: 'inventory_2' },
        { section: 'ads', title: 'Store ads', icon: 'campaign' },
        { section: 'seller-verifications', title: 'Identity checks', icon: 'verified_user' },
        { section: 'reports', title: 'Reports', icon: 'flag' },
      ],
    },
    {
      label: 'TOOLS',
      items: [
        { section: 'boosts', title: 'Visibility boosts', icon: 'trending_up' },
        { section: 'notifications', title: 'Notifications', icon: 'notifications' },
        { section: 'audit', title: 'Audit history', icon: 'history' },
      ],
    },
  ]

  return (
    <div className="admin-area">
      <header className="admin-area-header">
        <div className="admin-area-brand">
          <span className="material-icons" aria-hidden="true">shield</span>
          <div>
            <strong>MarketSpace Operations</strong>
            <small>{role === 'admin' ? 'Administrator' : 'Moderator'}</small>
          </div>
        </div>
        <button type="button" className="admin-area-signout" onClick={() => void signOut()}>
          <span className="material-icons" aria-hidden="true">logout</span> Sign out
        </button>
      </header>
      {signOutError && <p className="admin-area-error" role="alert">{signOutError}</p>}
      <div className="admin-area-layout">
        <aside className="admin-area-sidebar">
          <nav aria-label="Admin dashboard navigation">
            {navigationGroups.map(group => (
              <div className="admin-area-nav-group" key={group.label}>
                <p>{group.label}</p>
                {group.items.map(item => (
                  <button
                    type="button"
                    key={item.section}
                    className={activeSection === item.section ? 'active' : ''}
                    aria-current={activeSection === item.section ? 'page' : undefined}
                    onClick={() => navigateToSection(item.section)}
                  >
                    <span className="material-icons" aria-hidden="true">{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="admin-area-sidebar-note">
            <span className="material-icons" aria-hidden="true">lock</span>
            <span>Restricted moderator workspace</span>
          </div>
        </aside>
        <div className="admin-area-content">
          <Outlet context={{ role, activeSection, onNavigate: navigateToSection }} />
        </div>
      </div>
    </div>
  )
}

export function AdminArea() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminGate />}>
        <Route index element={<AdminStoreReviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
