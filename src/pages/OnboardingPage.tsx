import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types'

type OnboardingPageProps = {
  session: Session | null
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  setMessage: (msg: string) => void
}

/**
 * OnboardingScreen Component
 * Displayed after Authentication to let users choose their primary MarketSpace role:
 * - Option A: Buyer/Shopper (Direct zero-friction routing to marketplace feed)
 * - Option B: Seller/Store Owner (Triggers WhatsApp OTP Verification flow)
 */
// Configurable Zambian Admin WhatsApp Number (Replace with your actual admin number)
export const ADMIN_WHATSAPP_NUMBER = '260975932013'

export function OnboardingPage({ session, profile, setProfile, setMessage }: OnboardingPageProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState<string | null>(profile?.pending_otp || null)
  const [sellerPhone, setSellerPhone] = useState<string>(profile?.phone_number || '')
  const [loadingChoice, setLoadingChoice] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (profile?.phone_verified) {
      setMessage('Your seller account has been verified! Welcome to MarketSpace.')
      navigate('/')
      return
    }

    if (profile?.pending_otp) {
      setVerificationCode(profile.pending_otp)
      setIsVerifying(true)
    }

    // Realtime listener: Automatically redirects user when Admin sets phone_verified = TRUE in Supabase!
    if (session?.user?.id) {
      const channel = supabase
        .channel(`profile-verification-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            const updated = payload.new as Profile
            if (updated?.phone_verified) {
              if (profile) setProfile({ ...profile, phone_verified: true, onboarding_choice: 'seller' })
              setMessage('Your seller account has been verified by Admin! Welcome to MarketSpace.')
              navigate('/')
            }
          }
        )
        .subscribe()

      return () => {
        void supabase.removeChannel(channel)
      }
    }
  }, [profile?.phone_verified, profile?.pending_otp, session?.user?.id])

  // Option A: Buyer Route (Zero friction)
  const handleBuyerRoute = async () => {
    setLoadingChoice(true)
    if (session?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_choice: 'buyer' })
          .eq('user_id', session.user.id)

        if (profile) {
          setProfile({ ...profile, onboarding_choice: 'buyer' })
        }
      } catch (err) {
        console.error('Error saving onboarding choice:', err)
      }
    }
    setMessage('Welcome to MarketSpace!')
    navigate('/')
  }

  // Option B: Seller Route (Generates OTP & Saves Seller Phone Number)
  const handleSellerVerification = async () => {
    if (!sellerPhone.trim()) {
      setPhoneError('Please enter your WhatsApp mobile phone number.')
      return
    }
    setPhoneError('')
    setLoadingChoice(true)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setVerificationCode(otp)
    setIsVerifying(true)

    const formattedPhone = sellerPhone.trim()

    if (session?.user?.id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_number: formattedPhone,
          pending_otp: otp,
          onboarding_choice: 'seller',
        })
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error updating OTP:', error)
      }

      if (profile) {
        setProfile({
          ...profile,
          phone_number: formattedPhone,
          pending_otp: otp,
          onboarding_choice: 'seller',
        })
      }
    }

    // Direct WhatsApp message from seller to admin
    const messageText = `Hello MarketSpace Admin. I want to become a verified seller. My verification code is: ${otp}`
    const encodedMessage = encodeURIComponent(messageText)
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`

    setLoadingChoice(false)
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--panel, #181818)',
          border: '1px solid var(--border, #282828)',
          borderRadius: '16px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❖</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text, #ffffff)', marginBottom: '8px' }}>
          Welcome to MarketSpace!
        </h2>
        <p style={{ color: 'var(--text-secondary, #aaaaaa)', fontSize: '0.96rem', marginBottom: '32px', lineHeight: 1.5 }}>
          How do you plan to use the platform today?
        </p>

        {!isVerifying ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* OPTION A: BUYER BUTTON */}
            <button
              onClick={handleBuyerRoute}
              disabled={loadingChoice}
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border, #333333)',
                borderRadius: '12px',
                color: 'var(--text, #ffffff)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px' }}>🛍️ I just want to buy/shop</strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #aaaaaa)', fontWeight: 400 }}>
                  Browse local listings in Zambia immediately (Zero friction)
                </span>
              </div>
              <span className="material-icons" style={{ fontSize: '24px', color: '#3b82f6' }}>arrow_forward</span>
            </button>

            {/* OPTION B: SELLER CONTAINER */}
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text, #ffffff)', marginBottom: '4px' }}>
                🏪 I want to sell items / Open a store
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #aaaaaa)', marginBottom: '12px', lineHeight: 1.4 }}>
                Enter your WhatsApp mobile number to receive your seller verification OTP.
              </p>

              {phoneError && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.82rem', marginBottom: '10px' }}>
                  {phoneError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="tel"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="WhatsApp Number (e.g. 0971234567)"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg, #101010)',
                    border: '1px solid var(--border, #333333)',
                    borderRadius: '8px',
                    color: 'var(--text, #ffffff)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <button
                onClick={handleSellerVerification}
                disabled={loadingChoice}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'var(--primary, #3b82f6)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>verified_user</span>
                Verify via WhatsApp & Unlock Seller Tools
              </button>
            </div>
          </div>
        ) : (
          /* VERIFICATION PENDING STATE */
          <div style={{ animation: 'fadeInMega 0.3s ease-out' }}>
            <div
              style={{
                padding: '20px',
                border: '2px dashed #3b82f6',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Your WhatsApp Verification Code
              </span>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  letterSpacing: '6px',
                  color: '#ffffff',
                  margin: '12px 0',
                  fontFamily: 'monospace',
                }}
              >
                {verificationCode}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #aaaaaa)', margin: 0 }}>
                Send this 6-digit OTP in the opened WhatsApp chat to our Zambian Admin to verify your seller status.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleSellerVerification}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
                Re-open WhatsApp Verification Chat
              </button>

              <button
                onClick={handleBuyerRoute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  padding: '8px',
                  textDecoration: 'underline',
                }}
              >
                Skip for now & browse marketplace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
