import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { PaymentMethodItem, NotificationConfig } from '../types'

type SettingsPageProps = {
    theme: 'light' | 'dark'
    location: string
    cardSize: number
    onCardSizeChange: (size: number) => void
    onToggleTheme: () => void
    onGoHome: () => void
    currency: 'ZMW' | 'USD' | 'EUR'
    setCurrency: (curr: 'ZMW' | 'USD' | 'EUR') => void
    notificationsConfig: NotificationConfig
    setNotificationsConfig: React.Dispatch<React.SetStateAction<NotificationConfig>>
    blockedUserIds: string[]
    toggleBlockUser: (userId: string) => void
    paymentMethods: PaymentMethodItem[]
    addPaymentMethod: (item: Omit<PaymentMethodItem, 'id'>) => void
    removePaymentMethod: (id: string) => void
    browsingHistory: Array<{ id: number; title: string; price: number; image?: string; timestamp: string }>
    clearBrowsingHistory: () => void
    searchHistory: string[]
    clearSearchHistory: () => void
    userEmail?: string
}

export function SettingsPage({
    theme,
    location,
    cardSize,
    onCardSizeChange,
    onToggleTheme,
    onGoHome,
    currency,
    setCurrency,
    notificationsConfig,
    setNotificationsConfig,
    blockedUserIds,
    toggleBlockUser,
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    browsingHistory,
    clearBrowsingHistory,
    searchHistory,
    clearSearchHistory,
    userEmail = 'user@marketspace.zm',
}: SettingsPageProps) {
    const { category = 'account' } = useParams<{ category?: string }>()
    const navigate = useNavigate()

    // Account View local states
    const [passwordCurrent, setPasswordCurrent] = useState('')
    const [passwordNew, setPasswordNew] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [accountMsg, setAccountMsg] = useState('')
    const [verificationRequested, setVerificationRequested] = useState(false)

    // Payment Form state
    const [payType, setPayType] = useState<'mobile_money' | 'card' | 'bank'>('mobile_money')
    const [payTitle, setPayTitle] = useState('')
    const [payAcc, setPayAcc] = useState('')
    const [payProvider, setPayProvider] = useState('Airtel Zambia')

    // Audience Visibility toggles
    const [publicProfile, setPublicProfile] = useState(true)
    const [showPhone, setShowPhone] = useState(true)
    const [showEmail, setShowEmail] = useState(false)
    const [searchIndexable, setSearchIndexable] = useState(true)

    // Legal Document Tab
    const [legalTab, setLegalTab] = useState<'tos' | 'privacy' | 'buyer'>('tos')

    const handlePasswordChange = (e: FormEvent) => {
        e.preventDefault()
        if (!passwordCurrent || !passwordNew || !passwordConfirm) return
        if (passwordNew !== passwordConfirm) {
            setAccountMsg('Error: New passwords do not match!')
            return
        }
        setAccountMsg('Password changed successfully!')
        setPasswordCurrent('')
        setPasswordNew('')
        setPasswordConfirm('')
        setTimeout(() => setAccountMsg(''), 3000)
    }

    const handleAddPaymentSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!payTitle || !payAcc) return
        addPaymentMethod({
            type: payType,
            title: payTitle,
            accountNumber: payAcc,
            provider: payProvider,
        })
        setPayTitle('')
        setPayAcc('')
    }

    const activeTab = category.toLowerCase()

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }} className="settings-container">
            {/* Main Category Sub-page Content */}
            <section className="section-card settings-page" style={{ margin: 0, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    <button className="ghost-btn compact-btn" onClick={() => navigate('/settings')} style={{ padding: '6px 12px' }}>
                        ← Categories
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                        {activeTab === 'account' && 'Your Account & Security'}
                        {activeTab === 'preferences' && 'App Preferences'}
                        {activeTab === 'audience' && 'Audience & Privacy Visibility'}
                        {activeTab === 'payments' && 'Payments & Payouts'}
                        {activeTab === 'activity' && 'Your Activity & Log History'}
                        {activeTab === 'legal' && 'Community Standards & Legal Policies'}
                    </h2>
                </div>

                {/* 1. ACCOUNT SUB-PAGE */}
                {activeTab === 'account' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Personal Information</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Registered Email</span>
                                    <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{userEmail}</p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Account Verification Status</span>
                                    <p style={{ margin: '2px 0 0 0', color: verificationRequested ? '#10b981' : 'var(--text)', fontWeight: 600 }}>
                                        {verificationRequested ? 'Verification Pending Review' : 'Unverified (Standard Buyer/Seller)'}
                                    </p>
                                </div>
                                {!verificationRequested && (
                                    <button className="secondary-btn compact-btn" onClick={() => setVerificationRequested(true)} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                                        Request Verified Merchant Badge
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Password & Security</h3>
                            {accountMsg && (
                                <div style={{ background: accountMsg.startsWith('Error') ? '#fef2f2' : '#e2f0d9', color: accountMsg.startsWith('Error') ? '#ef4444' : '#385723', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.9rem', border: accountMsg.startsWith('Error') ? '1px solid #fca5a5' : 'none' }}>
                                    {accountMsg}
                                </div>
                            )}
                            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={passwordCurrent}
                                    onChange={(e) => setPasswordCurrent(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={passwordNew}
                                    onChange={(e) => setPasswordNew(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    required
                                />
                                <button className="primary-btn compact-btn" type="submit" style={{ alignSelf: 'flex-start' }}>Update Password</button>
                            </form>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Two-Factor Authentication (2FA)</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Add an extra layer of protection to your account with SMS or authenticator app codes.</p>
                            <button
                                className={twoFactorEnabled ? "secondary-btn compact-btn" : "primary-btn compact-btn"}
                                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                style={{ marginTop: '8px' }}
                            >
                                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
                            </button>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Active Sessions & Devices</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', padding: '8px', background: 'var(--surface)', borderRadius: '8px' }}>
                                    <div>
                                        <strong>Windows PC • Chrome Browser</strong>
                                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Current Active Session (Lusaka, ZM)</div>
                                    </div>
                                    <span className="badge" style={{ background: '#10b981', color: 'white' }}>Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <h3 style={{ marginTop: 0, color: '#ef4444', fontSize: '1.1rem' }}>Danger Zone</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Deactivating hides your listings. Deleting permanently erases your account data.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <button className="secondary-btn compact-btn delete-btn" onClick={() => alert('Account deactivation requested. Your listings have been hidden.')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                    Deactivate Account
                                </button>
                                <button
                                    className="primary-btn compact-btn"
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to PERMANENTLY delete your account? All your listings, store data, and chat history will be erased. This action cannot be undone.')) {
                                            alert('Account deletion request submitted.')
                                        }
                                    }}
                                    style={{ background: '#dc2626', color: 'white', border: 'none' }}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. PREFERENCES SUB-PAGE */}
                {activeTab === 'preferences' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Appearance & Theme</h3>
                            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Color Theme</h4>
                                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Switch between Light and Dark mode interfaces.</p>
                                </div>
                                <button className="secondary-btn" onClick={onToggleTheme} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="material-icons" style={{ fontSize: '18px' }}>{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                                    {theme === 'light' ? 'Dark mode' : 'Light mode'}
                                </button>
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Listing Feed Density & Card Size</h3>
                            <div className="setting-row range-row" style={{ marginTop: '12px' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Card Width: {cardSize}px</h4>
                                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Adjust how compact or large product cards appear in feeds.</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                                    <input
                                        type="range"
                                        min="130" max="260"
                                        value={cardSize}
                                        onChange={(event) => onCardSizeChange(Number(event.target.value))}
                                        style={{ flexGrow: 1 }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Location & Currency</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>Primary Marketplace Location</h4>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>Currently set to {location}</p>
                                    </div>
                                    <button className="secondary-btn compact-btn" onClick={onGoHome}>Change City</button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>Display Currency</h4>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>Select your preferred currency display.</p>
                                    </div>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as any)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    >
                                        <option value="ZMW">ZMW (Zambian Kwacha)</option>
                                        <option value="USD">USD ($ United States Dollar)</option>
                                        <option value="EUR">EUR (€ Euro)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Notification Preferences</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                {[
                                    { key: 'email', label: 'Email Notifications', desc: 'Receive message alerts and order updates via email' },
                                    { key: 'push', label: 'Browser Push Notifications', desc: 'Get instant pop-up alerts on desktop/mobile' },
                                    { key: 'sms', label: 'SMS Text Alerts', desc: 'Get text notifications for high-priority inquiries' },
                                    { key: 'orders', label: 'Order & Purchase Updates', desc: 'Alerts when someone requests or buys your listings' },
                                    { key: 'promos', label: 'Promotional & Store Updates', desc: 'News on feature updates and seller tips' },
                                ].map((item) => (
                                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div>
                                            <strong style={{ fontSize: '0.9rem' }}>{item.label}</strong>
                                            <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>{item.desc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={(notificationsConfig as any)[item.key]}
                                            onChange={(e) => setNotificationsConfig({ ...notificationsConfig, [item.key]: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. AUDIENCE & VISIBILITY SUB-PAGE */}
                {activeTab === 'audience' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Profile & Storefront Visibility</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>Public Seller Profile</strong>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Allow marketplace users to find your profile and storefront in search.</p>
                                    </div>
                                    <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                </label>

                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>Display Mobile Number on Listings</strong>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Show your WhatsApp/mobile number to buyers in the Buy Box.</p>
                                    </div>
                                    <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                </label>

                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>Display Email on Profile</strong>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Make your email visible to visitors on your seller profile page.</p>
                                    </div>
                                    <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                </label>

                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>Search Engine Indexing</strong>
                                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Allow Google and web search engines to index your store catalog.</p>
                                    </div>
                                    <input type="checkbox" checked={searchIndexable} onChange={(e) => setSearchIndexable(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                </label>
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Blocked Accounts</h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Blocked users cannot message you or view your seller listings.</p>
                            {blockedUserIds.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '10px' }}>You have not blocked any accounts.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    {blockedUserIds.map((id) => (
                                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface)', borderRadius: '8px' }}>
                                            <span>User ID: {id}</span>
                                            <button className="secondary-btn compact-btn" onClick={() => toggleBlockUser(id)}>Unblock</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. PAYMENTS & PAYOUTS SUB-PAGE */}
                {activeTab === 'payments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Saved Payment Methods & Payout Wallets</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                {paymentMethods.map((pm) => (
                                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="material-icons" style={{ fontSize: '24px', color: 'var(--primary)' }}>
                                                {pm.type === 'mobile_money' ? 'smartphone' : 'credit_card'}
                                            </span>
                                            <div>
                                                <strong style={{ fontSize: '0.92rem' }}>{pm.title} ({pm.provider})</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pm.accountNumber} {pm.isDefault && '• Primary Payout'}</div>
                                            </div>
                                        </div>
                                        <button className="secondary-btn compact-btn delete-btn" onClick={() => removePaymentMethod(pm.id)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add New Payment Method</h3>
                            <form onSubmit={handleAddPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <select value={payType} onChange={(e) => setPayType(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                                        <option value="mobile_money">Mobile Money Wallet</option>
                                        <option value="card">Debit / Credit Card</option>
                                        <option value="bank">Bank Account</option>
                                    </select>
                                    <input value={payProvider} onChange={(e) => setPayProvider(e.target.value)} placeholder="Provider (e.g. Airtel, MTN, Zanaco)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                </div>
                                <input value={payTitle} onChange={(e) => setPayTitle(e.target.value)} placeholder="Account Title (e.g. Personal Airtel Wallet)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                <input value={payAcc} onChange={(e) => setPayAcc(e.target.value)} placeholder="Phone Number / Card Number / Account #" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                <button className="primary-btn compact-btn" type="submit" style={{ alignSelf: 'flex-start' }}>Save Payment Method</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 5. YOUR ACTIVITY SUB-PAGE */}
                {activeTab === 'activity' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Browsing History</h3>
                                {browsingHistory.length > 0 && (
                                    <button className="secondary-btn compact-btn" onClick={clearBrowsingHistory}>Clear History</button>
                                )}
                            </div>
                            {browsingHistory.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '12px' }}>Your browsing history is clear.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    {browsingHistory.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}>
                                            <span>{item.title} (ZMW {item.price})</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{item.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="setting-box" style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Search Queries</h3>
                                {searchHistory.length > 0 && (
                                    <button className="secondary-btn compact-btn" onClick={clearSearchHistory}>Clear Searches</button>
                                )}
                            </div>
                            {searchHistory.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '12px' }}>No recent search queries.</p>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                    {searchHistory.map((term, i) => (
                                        <span key={i} className="badge" style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>{term}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. LEGAL SUB-PAGE */}
                {activeTab === 'legal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <button className={legalTab === 'tos' ? 'primary-btn compact-btn' : 'secondary-btn compact-btn'} onClick={() => setLegalTab('tos')}>Terms of Service</button>
                            <button className={legalTab === 'privacy' ? 'primary-btn compact-btn' : 'secondary-btn compact-btn'} onClick={() => setLegalTab('privacy')}>Privacy Policy</button>
                            <button className={legalTab === 'buyer' ? 'primary-btn compact-btn' : 'secondary-btn compact-btn'} onClick={() => setLegalTab('buyer')}>Buyer Protection</button>
                        </div>

                        <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                            {legalTab === 'tos' && (
                                <div>
                                    <h3 style={{ marginTop: 0 }}>MarketSpace Terms of Service</h3>
                                    <p>Welcome to MarketSpace. By using our platform to buy, sell, or advertise products and services, you agree to comply with our community standards. All listed products must comply with local laws in Zambia.</p>
                                    <p>Sellers are responsible for accurately describing items, pricing, and fulfillment. ImagineSpace Technologies provides the platform and communication tools to connect local buyers and sellers.</p>
                                </div>
                            )}
                            {legalTab === 'privacy' && (
                                <div>
                                    <h3 style={{ marginTop: 0 }}>Privacy Policy & Data Security</h3>
                                    <p>We respect your privacy. We collect minimal personal data necessary to facilitate account login, store profiles, and buyer-seller chat communication.</p>
                                    <p>Your password is cryptographically encrypted. We do not sell your personal information or contact details to third parties.</p>
                                    <button className="primary-btn compact-btn" onClick={() => alert('Data archive download initiated')} style={{ marginTop: '12px' }}>
                                        Download My Data Archive (.JSON)
                                    </button>
                                </div>
                            )}
                            {legalTab === 'buyer' && (
                                <div>
                                    <h3 style={{ marginTop: 0 }}>Buyer & Seller Protection Guidelines</h3>
                                    <p>Always inspect items in person when meeting sellers for local transactions. Verify mobile money payment receipts before releasing physical goods.</p>
                                    <p>Use MarketSpace direct messaging to maintain a clear record of purchase inquiries, agreed prices, and pickup locations.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Right Side: Sidebar Table of Contents Navigation */}
            <aside style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="settings-sidebar">
                <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--panel)', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontWeight: 700 }}>
                        Settings Menu
                    </h3>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                            { id: 'account', label: 'Your Account', icon: 'manage_accounts' },
                            { id: 'preferences', label: 'Preferences', icon: 'tune' },
                            { id: 'audience', label: 'Audience & Visibility', icon: 'visibility' },
                            { id: 'payments', label: 'Payments', icon: 'payment' },
                            { id: 'activity', label: 'Your Activity', icon: 'history' },
                            { id: 'legal', label: 'Legal & Policies', icon: 'gavel' },
                        ].map((item) => {
                            const isCurrent = activeTab === item.id
                            return (
                                <button
                                    key={item.id}
                                    className={isCurrent ? "primary-btn" : "ghost-btn"}
                                    onClick={() => navigate(`/settings/${item.id}`)}
                                    style={{
                                        textAlign: 'left',
                                        fontSize: '0.88rem',
                                        padding: '10px 12px',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        borderRadius: '8px',
                                        background: isCurrent ? 'var(--primary)' : 'transparent',
                                        color: isCurrent ? 'white' : 'var(--text)'
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px', color: isCurrent ? 'white' : 'var(--primary)' }}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>
            </aside>
        </div>
    )
}