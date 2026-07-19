import { type FormEvent } from 'react'
import './AuthPage.css'

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

export function AuthPage({
    mode, isSignedIn, userEmail, authEmail, authPassword, authUsername,
    onAuthEmailChange, onAuthPasswordChange, onAuthUsernameChange,
    onSubmit, onSwitchMode, onLogout, onGoProfile
}: AuthPageProps) {

    if (isSignedIn) {
        return (
            <div className="auth-container">
                <div className="auth-card signed-in-card">
                    <img src="https://ui-avatars.com/api/?name=Market+Space&background=1877f2&color=fff&size=80" alt="Profile" className="profile-pic" />
                    <h2>Signed in to MarketSpace</h2>
                    <p className="user-email">{userEmail}</p>
                    <button className="btn btn-primary w-100" onClick={onGoProfile}>View Profile</button>
                    <button className="btn btn-ghost w-100 mt-10" onClick={onLogout}>Sign Out</button>
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
                            ? 'Explore the things you love and connect with buyers and sellers.'
                            : 'Join MarketSpace to list items, save favorites, and start chatting.'}
                    </h2>
                </div>

                {/* Right Side: Auth Card */}
                <div className="auth-form-section">
                    <div className="auth-card">
                        <form onSubmit={onSubmit}>
                            {mode === 'signup' && (
                                <input
                                    className="auth-input"
                                    value={authUsername}
                                    onChange={(event) => onAuthUsernameChange(event.target.value)}
                                    placeholder="Username"
                                    required
                                />
                            )}
                            <input
                                className="auth-input"
                                value={authEmail}
                                onChange={(event) => onAuthEmailChange(event.target.value)}
                                placeholder="Email or phone number"
                                type="email"
                                required
                            />
                            <input
                                className="auth-input"
                                value={authPassword}
                                onChange={(event) => onAuthPasswordChange(event.target.value)}
                                placeholder="Password"
                                type="password"
                                required
                            />
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
                            <button
                                className="btn btn-success"
                                type="button"
                                onClick={onSwitchMode}
                            >
                                {mode === 'login' ? 'Create new account' : 'Already have an account?'}
                            </button>
                        </div>
                    </div>

                    {/* Extra text below the card */}
                    {mode === 'login' && (
                        <div className="auth-footer-text">
                            <a href="#"><strong>Create a Store</strong></a> for a brand or business.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}