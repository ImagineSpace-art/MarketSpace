import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { validatePassword } from '../utils/passwordValidation'
import { TurnstileCaptcha } from '../components/TurnstileCaptcha'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

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
  onSubmit: (event: FormEvent<HTMLFormElement>, captchaToken?: string) => Promise<void> | void
  onSwitchMode: () => void
  onLogout: () => void
  onGoProfile: () => void
}

/**
 * AuthenticationPage Component
 * Redesigned to match the reference design:
 * - Left/Background: Vector commerce & lifestyle illustration with dynamic waves
 * - Right: Golden/Amber card with white pill inputs, icons, 'Remember me', dark navy pill submit button,
 *   and social sign-in circles.
 * - Comprehensive real-time password security rules for Sign Up.
 */
export function AuthPage({
  mode,
  isSignedIn,
  userEmail,
  authEmail,
  authPassword,
  authUsername,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthUsernameChange,
  onSubmit,
  onSwitchMode,
  onLogout,
  onGoProfile,
}: AuthPageProps) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [localError, setLocalError] = useState('')
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [socialMessage, setSocialMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const receiveCaptchaToken = useCallback((token: string) => setCaptchaToken(token), [])

  const passwordRules = validatePassword(authPassword)
  const passwordsMatch = authPassword === confirmPassword

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError('')

    if (mode === 'signup') {
      if (!passwordRules.isValid) {
        setLocalError('Please ensure your password satisfies all security rules below.')
        return
      }
      if (!passwordsMatch) {
        setLocalError('Passwords do not match. Please verify both fields.')
        return
      }
      if (TURNSTILE_SITE_KEY && !captchaToken) {
        setLocalError('Complete the CAPTCHA challenge before creating an account.')
        return
      }
    }

    try {
      await onSubmit(e, captchaToken)
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please verify your credentials.')
    }
  }

  const handleSocialClick = (provider: string) => {
    setSocialMessage(`${provider} sign-in will be linked to your MarketSpace account shortly.`)
    setTimeout(() => setSocialMessage(''), 4000)
  }

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotSent(true)
    setTimeout(() => {
      setForgotSent(false)
      setForgotModalOpen(false)
      setForgotEmail('')
    }, 2800)
  }

  if (isSignedIn) {
    return (
      <div className="golden-auth-page-wrapper">
        <style>{`
          .golden-auth-page-wrapper {
            min-height: calc(100vh - 70px);
            background-color: #f1f4f9;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .signed-in-golden-card {
            background: #ffffff;
            border-radius: 28px;
            padding: 40px 36px;
            width: 100%;
            maxWidth: 440px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.08);
            text-align: center;
          }
        `}</style>
        <div className="signed-in-golden-card">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail || 'MarketSpace')}&background=0f172a&color=fff&size=96`}
            alt="Profile Avatar"
            style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Signed in to MarketSpace
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 24px 0' }}>
            {userEmail}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={onGoProfile}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                height: '46px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              Go to Dashboard & Profile
            </button>

            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fab829',
                color: '#0f172a',
                border: 'none',
                borderRadius: '9999px',
                height: '46px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(250, 184, 41, 0.3)',
              }}
            >
              Browse Marketplace
            </Link>

            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                borderRadius: '9999px',
                height: '42px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="golden-auth-page-wrapper">
      <style>{`
        .golden-auth-page-wrapper {
          min-height: calc(100vh - 65px);
          background-color: #eef2f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .golden-auth-canvas {
          width: 100%;
          max-width: 1120px;
          min-height: 620px;
          background-color: #ffffff;
          border-radius: 32px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          overflow: hidden;
          position: relative;
        }

        /* Left Side: Art Illustration */
        .golden-auth-art-col {
          position: relative;
          background: linear-gradient(135deg, #0b193d 0%, #1e3a8a 50%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .golden-auth-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .golden-auth-art-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.15), transparent 70%);
          pointer-events: none;
        }

        .golden-auth-art-caption {
          position: absolute;
          bottom: 28px;
          left: 28px;
          right: 28px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          padding: 16px 20px;
          color: #ffffff;
        }

        /* Right Side: Golden Card Column */
        .golden-auth-form-col {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 28px;
          background-color: #f8fafc;
        }

        .golden-amber-card {
          width: 100%;
          max-width: 410px;
          background: #fab829;
          border-radius: 28px;
          padding: 36px 30px;
          box-sizing: border-box;
          box-shadow: 0 14px 32px rgba(250, 184, 41, 0.3), 0 4px 12px rgba(0, 0, 0, 0.05);
          color: #0f172a;
          position: relative;
        }

        .golden-card-title {
          font-size: 1.45rem;
          font-weight: 700;
          text-align: center;
          margin: 0 0 24px 0;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        /* White Pill Inputs */
        .golden-pill-input-group {
          margin-bottom: 14px;
        }

        .golden-pill-input-wrapper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 9999px;
          height: 46px;
          padding: 0 16px;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }

        .golden-pill-input-wrapper:focus-within {
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .golden-pill-icon {
          color: #1e293b;
          font-size: 19px;
          user-select: none;
          display: flex;
          align-items: center;
        }

        .golden-pill-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 500;
          color: #0f172a;
          font-family: inherit;
        }

        .golden-pill-input::placeholder {
          color: #64748b;
          font-weight: 400;
        }

        .golden-pill-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .golden-pill-toggle-btn:hover {
          color: #0f172a;
        }

        /* Controls Row */
        .golden-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 16px 4px 22px 4px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #0f172a;
        }

        .golden-remember-label {
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          user-select: none;
        }

        .golden-circle-checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #0f172a;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }

        .golden-circle-checkbox.checked {
          background: #0f172a;
        }

        .golden-circle-dot {
          width: 6px;
          height: 6px;
          background: #fab829;
          border-radius: 50%;
        }

        .golden-forgot-link {
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .golden-forgot-link:hover {
          text-decoration: underline;
        }

        /* Midnight Navy Pill Submit Button */
        .golden-submit-pill-btn {
          width: 100%;
          height: 46px;
          border-radius: 9999px;
          background: #0a1128;
          color: #ffffff;
          border: none;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(10, 17, 40, 0.35);
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .golden-submit-pill-btn:hover {
          background: #050917;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(10, 17, 40, 0.45);
        }

        .golden-submit-pill-btn:active {
          transform: translateY(0);
        }

        /* Social Divider & Circles */
        .golden-social-section {
          margin-top: 24px;
          text-align: center;
        }

        .golden-social-text {
          font-size: 0.82rem;
          color: #0f172a;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .golden-social-icons-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
        }

        .golden-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 3px 8px rgba(0,0,0,0.12);
        }

        .golden-social-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0,0,0,0.18);
        }

        .golden-social-fb {
          background: #1877f2;
          color: #ffffff;
        }

        .golden-social-tw {
          background: #0ea5e9;
          color: #ffffff;
        }

        .golden-social-google {
          background: #ffffff;
          color: #ea4335;
        }

        /* Switch Mode & Back */
        .golden-footer-actions {
          margin-top: 22px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .golden-switch-btn {
          background: none;
          border: none;
          font-size: 0.84rem;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
          text-decoration: underline;
        }

        .golden-back-link {
          font-size: 0.78rem;
          color: #334155;
          text-decoration: none;
          font-weight: 600;
        }

        .golden-back-link:hover {
          color: #0f172a;
        }

        /* Password Rules Chips */
        .golden-pw-rules {
          background: rgba(255, 255, 255, 0.45);
          border: 1px solid rgba(15, 23, 42, 0.15);
          border-radius: 14px;
          padding: 10px 14px;
          margin-bottom: 14px;
          font-size: 0.76rem;
        }

        .golden-pw-rules-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .golden-rule-pass {
          color: #065f46;
          font-weight: 700;
        }

        .golden-rule-fail {
          color: #991b1b;
          font-weight: 600;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .golden-auth-canvas {
            grid-template-columns: 1fr;
            max-width: 480px;
            min-height: auto;
          }
          .golden-auth-art-col {
            display: none;
          }
          .golden-auth-form-col {
            padding: 36px 20px;
          }
        }
      `}</style>

      <div className="golden-auth-canvas">
        {/* Left Side: Dynamic Flat Commerce Art Illustration */}
        <div className="golden-auth-art-col">
          <img
            src="/illustrations/auth_art_banner.jpg"
            alt="MarketSpace Commerce & Lifestyle Illustration"
            className="golden-auth-art-img"
          />
          <div className="golden-auth-art-overlay" />
          
          <div className="golden-auth-art-caption">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem', color: '#fab829' }}>❖</span>
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.05rem' }}>MarketSpace</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9, lineHeight: 1.45 }}>
              Connecting independent merchants, verified digital storefronts, and shoppers across Zambia & beyond.
            </p>
          </div>
        </div>

        {/* Right Side: Golden / Amber Card */}
        <div className="golden-auth-form-col">
          <div className="golden-amber-card">
            
            <h1 className="golden-card-title">
              {mode === 'login' ? 'Login to continue' : 'Sign up to continue'}
            </h1>

            {localError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: '#7f1d1d',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                {localError}
              </div>
            )}

            {socialMessage && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.15)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                {socialMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Username Input (Sign up mode) */}
              {mode === 'signup' && (
                <div className="golden-pill-input-group">
                  <div className="golden-pill-input-wrapper">
                    <span className="material-icons golden-pill-icon">person</span>
                    <input
                      className="golden-pill-input"
                      placeholder="Username / Full Name"
                      value={authUsername}
                      onChange={(e) => onAuthUsernameChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Username/Email Input (Login mode) or Email Input (Sign up mode) */}
              <div className="golden-pill-input-group">
                <div className="golden-pill-input-wrapper">
                  <span className="material-icons golden-pill-icon">
                    {mode === 'login' ? 'person' : 'email'}
                  </span>
                  <input
                    className="golden-pill-input"
                    type={mode === 'login' ? 'text' : 'email'}
                    placeholder={mode === 'login' ? 'Username/Email' : 'Email Address'}
                    value={authEmail}
                    onChange={(e) => onAuthEmailChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input with Lock / Eye */}
              <div className="golden-pill-input-group">
                <div className="golden-pill-input-wrapper">
                  <span className="material-icons golden-pill-icon">
                    {showPassword ? 'visibility' : 'lock'}
                  </span>
                  <input
                    className="golden-pill-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => onAuthPasswordChange(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="golden-pill-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign up mode) */}
              {mode === 'signup' && (
                <div className="golden-pill-input-group">
                  <div className="golden-pill-input-wrapper">
                    <span className="material-icons golden-pill-icon">lock_reset</span>
                    <input
                      className="golden-pill-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="golden-pill-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sign up: Password Security Rules */}
              {mode === 'signup' && authPassword.length > 0 && (
                <div className="golden-pw-rules">
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                    Security Requirements:
                  </div>
                  <div className="golden-pw-rules-grid">
                    <span className={passwordRules.hasMinLength ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordRules.hasMinLength ? '✓' : '✗'} 8+ Characters
                    </span>
                    <span className={passwordRules.hasUpper ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordRules.hasUpper ? '✓' : '✗'} Uppercase (A-Z)
                    </span>
                    <span className={passwordRules.hasLower ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordRules.hasLower ? '✓' : '✗'} Lowercase (a-z)
                    </span>
                    <span className={passwordRules.hasDigit ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordRules.hasDigit ? '✓' : '✗'} Digit (0-9)
                    </span>
                    <span className={passwordRules.hasSymbol ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordRules.hasSymbol ? '✓' : '✗'} Special (!@#$)
                    </span>
                    <span className={passwordsMatch && confirmPassword ? 'golden-rule-pass' : 'golden-rule-fail'}>
                      {passwordsMatch && confirmPassword ? '✓' : '✗'} Match
                    </span>
                  </div>
                </div>
              )}

              {mode === 'signup' && TURNSTILE_SITE_KEY && (
                <div style={{ margin: '14px 0' }}>
                  <TurnstileCaptcha onToken={receiveCaptchaToken} />
                </div>
              )}

              {/* Controls Row: Remember me + Forget password */}
              <div className="golden-controls-row">
                <label className="golden-remember-label" onClick={() => setRememberMe(!rememberMe)}>
                  <span className={`golden-circle-checkbox ${rememberMe ? 'checked' : ''}`}>
                    {rememberMe && <span className="golden-circle-dot" />}
                  </span>
                  <span>Remember me</span>
                </label>

                {mode === 'login' && (
                  <button
                    type="button"
                    className="golden-forgot-link"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                    onClick={() => setForgotModalOpen(true)}
                  >
                    Forget password?
                  </button>
                )}
              </div>

              {/* Midnight Navy Pill Submit Button */}
              <button className="golden-submit-pill-btn" type="submit">
                {mode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>

            {/* Social Authentication Row */}
            <div className="golden-social-section">
              <div className="golden-social-text">
                {mode === 'login' ? 'or sign up using' : 'or join using'}
              </div>
              
              <div className="golden-social-icons-row">
                {/* Facebook Button */}
                <button
                  type="button"
                  className="golden-social-btn golden-social-fb"
                  onClick={() => handleSocialClick('Facebook')}
                  title="Sign in with Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>

                {/* Twitter / X Button */}
                <button
                  type="button"
                  className="golden-social-btn golden-social-tw"
                  onClick={() => handleSocialClick('Twitter / X')}
                  title="Sign in with Twitter / X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                {/* Google Button */}
                <button
                  type="button"
                  className="golden-social-btn golden-social-google"
                  onClick={() => handleSocialClick('Google')}
                  title="Sign in with Google"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mode Switch & Back to Marketplace */}
            <div className="golden-footer-actions">
              <button type="button" className="golden-switch-btn" onClick={onSwitchMode}>
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>

              <Link to="/" className="golden-back-link">
                ← Back to MarketSpace Marketplace
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px 28px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>
              Reset Password
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Enter your registered email address and we'll send you instructions to securely reset your password.
            </p>

            {forgotSent ? (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, textAlign: 'center' }}>
                ✓ Recovery link sent! Please check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="golden-pill-input-wrapper" style={{ border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                  <span className="material-icons golden-pill-icon">email</span>
                  <input
                    className="golden-pill-input"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '9999px',
                      border: '1px solid #cbd5e1',
                      background: 'transparent',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}