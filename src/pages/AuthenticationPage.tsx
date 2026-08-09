import { useState, type FormEvent } from 'react'
import { validatePassword } from '../utils/passwordValidation'

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
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  onSwitchMode: () => void
  onLogout: () => void
  onGoProfile: () => void
}

/**
 * AuthenticationPage Component
 * Handles Secure Login and Sign Up with:
 * - Real-time strong password rules validation (8+ chars, upper, lower, digit, symbol)
 * - Confirm password input field & validation (Sign Up mode)
 * - Show/Hide Password visibility toggle buttons (eye icon)
 * - Clear guidance banner for email confirmation
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
  const [localError, setLocalError] = useState('')

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
    }

    await onSubmit(e)
  }

  if (isSignedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card signed-in-card">
          <img
            src="https://ui-avatars.com/api/?name=Market+Space&background=1877f2&color=fff&size=80"
            alt="Profile"
            className="profile-pic"
          />
          <h2>Signed in to MarketSpace</h2>
          <p className="user-email">{userEmail}</p>
          <button className="btn btn-primary w-100" onClick={onGoProfile}>
            View Profile
          </button>
          <button className="btn btn-ghost w-100 mt-10" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Left Side: Branding */}
        <div className="auth-brand-section">
          <h1 className="auth-logo">MarketSpace</h1>
          <h2 className="auth-subtitle">
            {mode === 'login'
              ? 'Explore the things you love and connect with buyers and sellers in Zambia.'
              : 'Join MarketSpace to list items, save favorites, and connect directly on WhatsApp.'}
          </h2>
        </div>

        {/* Right Side: Auth Form */}
        <div className="auth-form-section">
          <div className="auth-card">
            {localError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.86rem',
                  marginBottom: '14px',
                }}
              >
                {localError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {mode === 'signup' && (
                <input
                  className="auth-input"
                  value={authUsername}
                  onChange={(event) => onAuthUsernameChange(event.target.value)}
                  placeholder="Username / Full Name"
                  required
                />
              )}

              <input
                className="auth-input"
                value={authEmail}
                onChange={(event) => onAuthEmailChange(event.target.value)}
                placeholder="Email address"
                type="email"
                required
              />

              {/* Password Input with Show/Hide Toggle */}
              <div style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
                <input
                  className="auth-input"
                  value={authPassword}
                  onChange={(event) => onAuthPasswordChange(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  style={{ width: '100%', paddingRight: '42px', marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary, #888888)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Confirm Password Field (Sign-Up Mode) */}
              {mode === 'signup' && (
                <div style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
                  <input
                    className="auth-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    style={{ width: '100%', paddingRight: '42px', marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #888888)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons" style={{ fontSize: '20px' }}>
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              )}

              {/* Password Strength Real-time Checklist (Sign-Up Mode) */}
              {mode === 'signup' && authPassword.length > 0 && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border, #333)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text, #fff)', marginBottom: '6px' }}>
                    Password Security Requirements:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <span style={{ color: passwordRules.hasMinLength ? '#22c55e' : '#ef4444' }}>
                      {passwordRules.hasMinLength ? '✓' : '✗'} 8+ Characters
                    </span>
                    <span style={{ color: passwordRules.hasUpper ? '#22c55e' : '#ef4444' }}>
                      {passwordRules.hasUpper ? '✓' : '✗'} Uppercase (A-Z)
                    </span>
                    <span style={{ color: passwordRules.hasLower ? '#22c55e' : '#ef4444' }}>
                      {passwordRules.hasLower ? '✓' : '✗'} Lowercase (a-z)
                    </span>
                    <span style={{ color: passwordRules.hasDigit ? '#22c55e' : '#ef4444' }}>
                      {passwordRules.hasDigit ? '✓' : '✗'} Number (0-9)
                    </span>
                    <span style={{ color: passwordRules.hasSymbol ? '#22c55e' : '#ef4444' }}>
                      {passwordRules.hasSymbol ? '✓' : '✗'} Symbol (!@#$)
                    </span>
                    <span style={{ color: passwordsMatch && confirmPassword ? '#22c55e' : '#ef4444' }}>
                      {passwordsMatch && confirmPassword ? '✓' : '✗'} Passwords Match
                    </span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-100" type="submit">
                {mode === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            {mode === 'login' && (
              <div className="auth-forgot-password">
                <a href="#">Forgot password?</a>
              </div>
            )}

            <div className="auth-divider"></div>

            <div className="auth-switch-wrapper">
              <button className="btn btn-success" type="button" onClick={onSwitchMode}>
                {mode === 'login' ? 'Create new account' : 'Already have an account?'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}