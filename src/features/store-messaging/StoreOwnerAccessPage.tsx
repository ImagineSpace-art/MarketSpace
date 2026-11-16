import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BusinessProfile } from '../../types'
import { supabase } from '../../lib/supabaseClient'
import { getMarketplaceRootUrl } from '../../utils/storeUrl'

export function StoreOwnerLoginPage({ shop }: { shop: BusinessProfile }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (loginError) {
      setIsLoading(false)
      setError(loginError.message)
      return
    }

    const { data: ownedStore, error: ownerCheckError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', shop.storeId || '')
      .eq('user_id', data.user.id)
      .maybeSingle()
    if (ownerCheckError) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      setIsLoading(false)
      setError(signOutError
        ? `Store ownership could not be verified (${ownerCheckError.message}), and sign-out failed (${signOutError.message}).`
        : `Store ownership could not be verified: ${ownerCheckError.message}`)
      return
    }
    if (!ownedStore || data.user.id !== shop.userId) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      setIsLoading(false)
      setError(signOutError
        ? `This MarketSpace account does not own this store, and sign-out failed: ${signOutError.message}`
        : 'This MarketSpace account does not own this store.')
      return
    }

    setIsLoading(false)
    navigate('/owner/onboarding', { replace: true })
  }

  return (
    <main className="store-owner-page store-owner-login">
      <a className="store-owner-back-link" href={`/store/${encodeURIComponent(shop.userId)}`}>← Back to {shop.shopName}</a>
      <section>
        <p>Store owner access</p>
        <h1>Sign in to {shop.shopName}</h1>
        <span>Use the MarketSpace account that owns this store.</span>
        {error && <p className="store-message-error" role="alert">{error}</p>}
        <form className="store-owner-login-form" onSubmit={(event) => void submit(event)}>
          <label>
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={isLoading}>{isLoading ? 'Checking store access…' : 'Sign in as store owner'}</button>
        </form>
      </section>
    </main>
  )
}

export function StoreOwnerOnboardingPage({ shop }: { shop: BusinessProfile }) {
  const navigate = useNavigate()
  return (
    <main className="store-owner-page store-owner-onboarding">
      <section>
        <p>Welcome, store owner</p>
        <h1>Where would you like to go?</h1>
        <span>You are signed in as the owner of {shop.shopName}.</span>
        <div>
          <button type="button" onClick={() => navigate(`/store/${encodeURIComponent(shop.userId)}`)}>
            Open my store
          </button>
          <a href={getMarketplaceRootUrl()}>Browse MarketSpace</a>
          <button type="button" className="store-message-secondary" onClick={() => navigate('/owner/messages')}>
            View guest inquiries
          </button>
        </div>
      </section>
    </main>
  )
}
