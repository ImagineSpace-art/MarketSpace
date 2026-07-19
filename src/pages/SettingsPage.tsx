import './SettingsPage.css'

// ---------------- SETTINGS PAGE ----------------
type SettingsPageProps = {
    theme: 'light' | 'dark'
    location: string
    cardSize: number
    onCardSizeChange: (size: number) => void
    onToggleTheme: () => void
    onGoHome: () => void
}

export function SettingsPage({ theme, location, cardSize, onCardSizeChange, onToggleTheme, onGoHome }: SettingsPageProps) {
    return (
        <section className="section-card settings-page">
            {/* Header & Search */}
            <div className="settings-header">
                <h2>Settings & privacy</h2>
                <div className="settings-search">
                    <input type="text" placeholder="Search settings" />
                </div>
            </div>

            {/* 1. Your account */}
            <div className="settings-section">
                <h3 className="section-title">Your account</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Accounts Center</h4>
                        <p className="text-muted">Password, security, personal details, and verification.</p>
                    </div>
                    <button className="secondary-btn">Manage</button>
                </div>
            </div>

            {/* 2. Preferences */}
            <div className="settings-section">
                <h3 className="section-title">Preferences</h3>
                <p className="section-description text-muted">Customize your MarketSpace experience.</p>

                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Theme</h4>
                        <p className="text-muted">Switch between light and dark mode.</p>
                    </div>
                    <button className="secondary-btn" onClick={onToggleTheme}>
                        {theme === 'light' ? 'Dark mode' : 'Light mode'}
                    </button>
                </div>

                <div className="setting-row range-row">
                    <div className="setting-info">
                        <h4>Card Size</h4>
                        <p className="text-muted">Adjust the size of listings on the homepage feed.</p>
                    </div>
                    <div className="range-control">
                        <input
                            type="range"
                            min="130" max="260"
                            value={cardSize}
                            onChange={(event) => onCardSizeChange(Number(event.target.value))}
                        />
                        <span className="range-value">{cardSize}px</span>
                    </div>
                </div>

                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Location & Radius</h4>
                        <p className="text-muted">Currently browsing around {location} (Within 65 km).</p>
                    </div>
                    <button className="secondary-btn" onClick={onGoHome}>Update</button>
                </div>

                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Notifications</h4>
                        <p className="text-muted">Push, email, and SMS alerts for messages and updates.</p>
                    </div>
                    <button className="secondary-btn">Edit</button>
                </div>
            </div>

            {/* 3. Audience and visibility */}
            <div className="settings-section">
                <h3 className="section-title">Audience and visibility</h3>
                <p className="section-description text-muted">Control who can see your seller profile and listings.</p>

                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Profile details</h4>
                        <p className="text-muted">Manage your public store info, ratings, and contact methods.</p>
                    </div>
                    <button className="secondary-btn">Edit</button>
                </div>

                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Blocking</h4>
                        <p className="text-muted">Review people you've previously blocked from messaging or buying.</p>
                    </div>
                    <button className="secondary-btn">Review</button>
                </div>
            </div>

            {/* 4. Payments */}
            <div className="settings-section">
                <h3 className="section-title">Payments</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Payment methods</h4>
                        <p className="text-muted">Manage your saved cards and payout accounts.</p>
                    </div>
                    <button className="secondary-btn">Manage</button>
                </div>
            </div>

            {/* 5. Your activity */}
            <div className="settings-section">
                <h3 className="section-title">Your activity</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <h4>Activity log</h4>
                        <p className="text-muted">View your browsing history, saved items, and past purchases.</p>
                    </div>
                    <button className="secondary-btn">View</button>
                </div>
            </div>

            {/* 6. Legal & Policies */}
            <div className="settings-section">
                <h3 className="section-title">Community Standards and legal policies</h3>
                <div className="legal-links">
                    <span>Terms of Service</span>
                    <span>Privacy Policy</span>
                    <span>Buyer Protection Policy</span>
                </div>
            </div>
        </section>
    )
}