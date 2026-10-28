import { useState } from 'react'
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

export function OnboardingPage({ session, profile, setProfile, setMessage }: OnboardingPageProps) {
  const [loadingChoice, setLoadingChoice] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const chooseRole = async (choice: 'buyer' | 'seller') => {
    if (!session?.user.id) {
      setError('Please sign in again to continue.')
      return
    }

    setLoadingChoice(true)
    setError('')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_choice: choice })
      .eq('user_id', session.user.id)

    if (updateError) {
      setError(updateError.message)
      setLoadingChoice(false)
      return
    }

    if (profile) setProfile({ ...profile, onboarding_choice: choice })
    if (choice === 'seller') {
      setMessage('Let’s set up your store. Verify your phone and complete the guided application.')
      navigate('/profile/business-setup')
    } else {
      setMessage('Welcome to MarketSpace!')
      navigate('/')
    }
    setLoadingChoice(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: '24px 16px' }}>
      <section style={{
        width: 'min(100%, 560px)',
        padding: 'clamp(24px, 5vw, 40px)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ margin: '0 0 8px', color: '#2563eb', fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em' }}>WELCOME TO MARKETSPACE</p>
        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>What would you like to do?</h2>
        <p style={{ margin: '10px 0 24px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Shop the marketplace or open a store with a guided, save-as-you-go application.
        </p>
        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          <button type="button" className="secondary-btn" disabled={loadingChoice} onClick={() => void chooseRole('buyer')}>
            Browse and shop
          </button>
          <button type="button" className="primary-btn" disabled={loadingChoice} onClick={() => void chooseRole('seller')}>
            Open a store
          </button>
        </div>
      </section>
    </div>
  )
}
