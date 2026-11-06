import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'
import { TurnstileCaptcha } from '../components/TurnstileCaptcha'
import { isAtLeast18, isValidZambianNrc, validateOptionalMapCoordinates } from '../../supabase/functions/_shared/storeRegistrationValidation'
import { getFunctionErrorMessage } from '../utils/functionError'
import { makeMetadataFreeImage } from '../features/marketplace/metadataFreeImage'
import './StoreRegistrationWizard.css'
import { STORE_MARKET_LOCATIONS } from '../features/marketplace/storeLocations'
import { StorePoliciesEditor } from '../components/StorePoliciesEditor'
import { normalizeStorePolicies, validateStorePolicies, type StorePolicy } from '../utils/storePolicies'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

type RegistrationData = {
  identity: {
    firstName: string
    lastName: string
    legalName: string
    dateOfBirth: string
    residentialAddress: string
    idImagePath: string
    selfiePath: string
  }
  store: {
    name: string
    subdomain: string
    category: string
    description: string
    logo: string
    type: 'physical' | 'online_delivery' | 'meetup_only'
    supportContact: string
    businessRegistrationNumber: string
  }
  location: {
    marketplaceLocation: string
    streetAddress: string
    latitude: string
    longitude: string
    openingHours: string
    deliveryAreas: string
    safeMeetupLocations: string
    verificationMethod: 'photo' | 'video'
    proofPath: string
  }
  policies: {
    termsAccepted: boolean
    termsAcceptedVersion: string
    prohibitedItemsAccepted: boolean
    storePolicies: StorePolicy[]
    deliveryPolicy?: string
    returnPolicy?: string
  }
}

const INITIAL_DATA: RegistrationData = {
  identity: {
    firstName: '',
    lastName: '',
    legalName: '',
    dateOfBirth: '',
    residentialAddress: '',
    idImagePath: '',
    selfiePath: '',
  },
  store: {
    name: '',
    subdomain: '',
    category: 'Retail & Boutique',
    description: '',
    logo: '',
    type: 'online_delivery',
    supportContact: '',
    businessRegistrationNumber: '',
  },
  location: {
    marketplaceLocation: '',
    streetAddress: '',
    latitude: '',
    longitude: '',
    openingHours: '',
    deliveryAreas: '',
    safeMeetupLocations: '',
    verificationMethod: 'photo',
    proofPath: '',
  },
  policies: {
    termsAccepted: false,
    termsAcceptedVersion: '',
    prohibitedItemsAccepted: false,
    storePolicies: [],
  },
}

const STEP_TITLES = [
  'Your account',
  'Owner identity',
  'Store details',
  'Location',
  'Policies',
  'Review & submit',
]

const PHONE_OTP_REQUIRED = import.meta.env.VITE_PHONE_OTP_REQUIRED !== 'false'
const STORE_DOMAIN = import.meta.env.VITE_STORE_DOMAIN || 'yourdomain.com'
const PROHIBITED_ITEMS_VERSION = '2026-10-26'

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: 'var(--shadow)',
}

function normalizeZambianPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('260')) return `+${digits}`
  if (digits.startsWith('0')) return `+260${digits.slice(1)}`
  return `+260${digits}`
}

type StoreRegistrationWizardProps = {
  userId: string
  onCancel: () => void
}

export function StoreRegistrationWizard({ userId, onCancel }: StoreRegistrationWizardProps) {
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaGeneration, setCaptchaGeneration] = useState(0)
  const [identityNumber, setIdentityNumber] = useState('')
  const [subdomainState, setSubdomainState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [logoUploading, setLogoUploading] = useState(false)
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [email, setEmail] = useState('')
  const [termsDocument, setTermsDocument] = useState<{ version: number; content: string } | null>(null)
  const [termsError, setTermsError] = useState('')
  const lastMapRequest = useRef(0)

  const update = useCallback(<K extends keyof RegistrationData>(
    section: K,
    patch: Partial<RegistrationData[K]>,
  ) => {
    setData((current) => ({
      ...current,
      [section]: { ...current[section], ...patch },
    }))
  }, [])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        if (alive) setError(authError.message)
        if (alive) setLoading(false)
        return
      }
      if (authData.user?.id !== userId) {
        if (alive) setError('Your sign-in session changed. Please reload and try again.')
        if (alive) setLoading(false)
        return
      }
      setEmail(authData.user.email || '')
      setEmailVerified(Boolean(authData.user.email_confirmed_at))
      setPhone(authData.user.phone || '')
      setPhoneVerified(Boolean(authData.user.phone_confirmed_at))
      const { data: terms, error: termsQueryError } = await supabase
        .from('marketspace_terms')
        .select('version, content')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (termsQueryError || !terms) {
        if (alive) setTermsError('MarketSpace terms could not be loaded. Please try again later.')
      } else if (alive) {
        setTermsDocument({ version: terms.version, content: terms.content })
      }
      const { data: draft, error: draftError } = await supabase
        .from('store_registration_drafts')
        .select('current_step, data, status')
        .eq('user_id', userId)
        .maybeSingle()
      if (draftError && draftError.code !== 'PGRST116') {
        if (alive) setError(draftError.message)
      } else if (draft) {
        if (alive) {
          const draftData = draft.data as Partial<RegistrationData>
          const savedIdentity = draftData.identity
          const legacyName = savedIdentity?.legalName?.trim() || ''
          const [legacyFirstName = '', ...legacyLastName] = legacyName.split(/\s+/)
          const firstName = savedIdentity?.firstName || legacyFirstName
          const lastName = savedIdentity?.lastName || legacyLastName.join(' ')
          setData({
            ...INITIAL_DATA,
            ...draftData,
            identity: {
              ...INITIAL_DATA.identity,
              ...savedIdentity,
              firstName,
              lastName,
              legalName: [firstName, lastName].filter(Boolean).join(' ').trim(),
            },
            policies: {
              ...INITIAL_DATA.policies,
              ...draftData.policies,
              storePolicies: normalizeStorePolicies({
                policies: draftData.policies?.storePolicies,
                deliveryPolicy: draftData.policies?.deliveryPolicy,
                returnPolicy: draftData.policies?.returnPolicy,
              }),
            },
          })
          setStep(Math.min(Math.max(Number(draft.current_step) || 1, 1), 6))
          if (draft.status !== 'draft') setApplicationStatus(draft.status)
          if (draft.status === 'rejected') {
            const { data: store } = await supabase.from('stores').select('rejection_reason').eq('user_id', userId).maybeSingle()
            if (alive && store?.rejection_reason) setRejectionReason(store.rejection_reason)
          }
        }
      }
      if (alive) setLoading(false)
    }
    void load()
    return () => { alive = false }
  }, [userId])

  const receiveCaptchaToken = useCallback((token: string) => setCaptchaToken(token), [])

  const invoke = async <T,>(action: string, body: Record<string, unknown> = {}) => {
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) throw new Error('Your sign-in session could not be checked. Please sign in again.')
    if (!authData.session?.access_token) throw new Error('Your session expired, please sign in again')

    const { data: response, error: functionError } = await supabase.functions.invoke<T>('store-registration', {
      body: { action, ...body },
      headers: { Authorization: `Bearer ${authData.session.access_token}` },
    })
    if (functionError) throw new Error(await getFunctionErrorMessage(functionError))
    if (!response) throw new Error('The registration service returned no response.')
    const result = response as T & { error?: string }
    if (result.error) throw new Error(result.error)
    return result
  }

  const saveDraft = async (nextStep: number, options?: { identityNumber?: string }) => {
    const safeData: RegistrationData = { ...data, identity: { ...data.identity } }
    setSaving(true)
    try {
      await invoke<{ saved: boolean }>('save_draft', {
        step: nextStep,
        data: safeData,
        identityNumber: options?.identityNumber || '',
        captchaToken,
      })
      if (options?.identityNumber) setIdentityNumber('')
      setNotice('Progress saved securely. You can return to this step later.')
    } finally {
      setSaving(false)
    }
  }

  const checkSubdomain = async () => {
    const slug = data.store.subdomain.trim().toLowerCase()
    if (!slug) return false
    setSubdomainState('checking')
    try {
      const response = await invoke<{ available: boolean; message?: string }>('check_subdomain', { subdomain: slug })
      setSubdomainState(response.available ? 'available' : 'taken')
      if (!response.available) setError(response.message || 'That store address is unavailable.')
      return response.available
    } catch (err) {
      setSubdomainState('idle')
      setError(err instanceof Error ? err.message : 'Could not check the store address.')
      return false
    }
  }

  const sendPhoneOtp = async () => {
    setError('')
    setNotice('')
    if (!emailVerified) {
      setError('Confirm your email address before verifying a phone number.')
      return
    }
    if (!captchaToken && TURNSTILE_SITE_KEY) {
      setError('Complete the CAPTCHA challenge before continuing.')
      return
    }
    const normalized = normalizeZambianPhone(phone)
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError('Enter a valid phone number in international format, such as +260971234567.')
      return
    }
    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ phone: normalized })
      if (updateError) throw updateError
      setPhone(normalized)
      setOtpSent(true)
      setNotice('Supabase Auth sent a verification code. Enter the code to verify this number.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a phone verification code.')
    } finally {
      setSaving(false)
    }
  }

  const verifyPhoneOtp = async () => {
    setError('')
    setSaving(true)
    try {
      const { data: result, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizeZambianPhone(phone),
        token: otp.trim(),
        type: 'phone_change',
      })
      if (verifyError) throw verifyError
      if (!result.user?.phone_confirmed_at) throw new Error('Supabase did not confirm this phone number.')
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone_number: result.user.phone || normalizeZambianPhone(phone), phone_verified: true })
        .eq('user_id', userId)
      if (profileError) throw profileError
      setPhoneVerified(true)
      setOtpSent(false)
      setNotice('Phone verified successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The phone verification code was not accepted.')
    } finally {
      setSaving(false)
    }
  }

  const refreshAccountStatus = async () => {
    setError('')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      setError(authError?.message || 'Your sign-in session could not be checked.')
      return
    }
    setEmailVerified(Boolean(authData.user.email_confirmed_at))
    setPhoneVerified(Boolean(authData.user.phone_confirmed_at))
    if (authData.user.phone) setPhone(authData.user.phone)
    setNotice('Account verification status refreshed.')
  }

  const resendEmailConfirmation = async () => {
    setError('')
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
    if (resendError) setError(resendError.message)
    else setNotice('A new email confirmation link has been sent.')
  }

  const uploadPrivateImage = async (
    event: ChangeEvent<HTMLInputElement>,
    field: 'idImagePath' | 'selfiePath' | 'proofPath',
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setSaving(true)
    try {
      const cleanedImage = await makeMetadataFreeImage(file)
      const path = `${userId}/${field}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('store-private')
        .upload(path, cleanedImage, { contentType: 'image/jpeg', upsert: false })
      if (uploadError) throw uploadError
      if (field === 'proofPath') update('location', { proofPath: path })
      else if (field === 'idImagePath') update('identity', { idImagePath: path })
      else update('identity', { selfiePath: path })
      setNotice('Private image uploaded. It is only available to authorized reviewers.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The image could not be uploaded.')
    } finally {
      setSaving(false)
    }
  }

  const searchAddress = async () => {
    setError('')
    const address = data.location.streetAddress.trim()
    if (!address) {
      setError('Enter a street address before searching for map coordinates.')
      return
    }
    if (searchingLocation) return
    setSearchingLocation(true)
    try {
      const wait = Math.max(0, 1100 - (Date.now() - lastMapRequest.current))
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait))
      lastMapRequest.current = Date.now()
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('limit', '1')
      url.searchParams.set('q', address)
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Map search failed (${response.status}).`)
      const results = await response.json() as Array<{ lat: string; lon: string }>
      if (!results.length) throw new Error('No matching map location was found. You can continue without a map pin.')
      update('location', { latitude: results[0].lat, longitude: results[0].lon })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find this address on the map.')
    } finally {
      setSearchingLocation(false)
    }
  }

  const uploadStoreLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setLogoUploading(true)
    try {
      const logo = await uploadImageToSupabase(file, 'marketspace-media', 'store-logos')
      update('store', { logo })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The store logo could not be uploaded.')
    } finally {
      setLogoUploading(false)
    }
  }

  const validateStep = async () => {
    setError('')
    setNotice('')
    try {
      if (step === 1) {
        if (!emailVerified) throw new Error('Confirm your email before opening a store.')
        if (PHONE_OTP_REQUIRED && !phoneVerified) throw new Error('Verify your phone number before continuing.')
        if (TURNSTILE_SITE_KEY && !captchaToken) throw new Error('Complete the CAPTCHA challenge before continuing.')
        await saveDraft(1)
        setCaptchaToken('')
      } else if (step === 2) {
        if (!data.identity.firstName.trim() || !data.identity.lastName.trim() || data.identity.legalName.trim().length < 4) {
          throw new Error('Enter your first and last legal names as shown on your ID.')
        }
        if (!isAtLeast18(data.identity.dateOfBirth)) throw new Error('Store owners must be at least 18 years old.')
        if (data.identity.residentialAddress.trim().length < 8) throw new Error('Enter your complete residential address.')
        if (!isValidZambianNrc(identityNumber)) throw new Error('Enter your 9-digit NRC number using numbers only.')
        if (!data.identity.idImagePath || !data.identity.selfiePath) throw new Error('Upload both your government ID and a live selfie.')
        await saveDraft(2, { identityNumber })
      } else if (step === 3) {
        const valid = await checkSubdomain()
        if (!valid) return
        if (data.store.name.trim().length < 2) throw new Error('Store name must contain at least two characters.')
        if (data.store.description.trim().length < 20) throw new Error('Add a description of at least 20 characters.')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.store.supportContact.trim()) &&
          !/^\+?[0-9 ()-]{8,20}$/.test(data.store.supportContact.trim())) {
          throw new Error('Enter a valid email address or WhatsApp number for store support.')
        }
        await saveDraft(3)
      } else if (step === 4) {
        if (!data.location.marketplaceLocation.trim()) throw new Error('Select the marketplace location for your store.')
        if (data.store.type === 'physical') {
          if (data.location.streetAddress.trim().length < 8) throw new Error('Enter the physical storefront address.')
          const coordinateError = validateOptionalMapCoordinates(data.location.latitude, data.location.longitude)
          if (coordinateError) throw new Error(coordinateError)
        } else if (data.store.type === 'online_delivery' && !data.location.deliveryAreas.trim()) {
          throw new Error('List the areas this store delivers to.')
        } else if (data.store.type === 'meetup_only' && !data.location.safeMeetupLocations.trim()) {
          throw new Error('List the safe meetup locations offered to customers.')
        }
        if (data.location.verificationMethod === 'photo' && !data.location.proofPath) {
          throw new Error('Upload a location photo, or choose a video call with a reviewer.')
        }
        await saveDraft(4)
      } else if (step === 5) {
        if (!termsDocument) throw new Error(termsError || 'MarketSpace terms are unavailable. Please try again later.')
        if (!data.policies.termsAccepted ||
          data.policies.termsAcceptedVersion !== String(termsDocument.version) ||
          !data.policies.prohibitedItemsAccepted) {
          throw new Error('Review and accept each policy to continue.')
        }
        const policiesError = validateStorePolicies(data.policies.storePolicies)
        if (policiesError) throw new Error(policiesError)
        await saveDraft(5)
      }
      setStep((current) => Math.min(current + 1, 6))
    } catch (err) {
      if (step === 1 && TURNSTILE_SITE_KEY) {
        setCaptchaToken('')
        setCaptchaGeneration((generation) => generation + 1)
      }
      setError(err instanceof Error ? err.message : 'Please review this step and try again.')
    }
  }

  const submitApplication = async () => {
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const response = await invoke<{ status: string; emailWarning?: string }>('submit_application', {
        captchaToken,
        termsVersion: termsDocument?.version,
        prohibitedItemsVersion: PROHIBITED_ITEMS_VERSION,
      })
      setApplicationStatus(response.status)
      setNotice(response.emailWarning || 'Your application has been submitted for review.')
    } catch (err) {
      if (TURNSTILE_SITE_KEY) {
        setCaptchaToken('')
        setCaptchaGeneration((generation) => generation + 1)
      }
      setError(err instanceof Error ? err.message : 'Your application could not be submitted.')
    } finally {
      setSaving(false)
    }
  }

  const renderPrivateUpload = (
    label: string,
    field: 'idImagePath' | 'selfiePath' | 'proofPath',
    path: string,
  ) => (
    <label className="store-wizard-upload">
      <span>{label}</span>
      <small>{path ? 'Private image uploaded' : 'JPEG, PNG, or WebP · max 8 MB · EXIF removed'}</small>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadPrivateImage(event, field)} />
    </label>
  )

  const isPending = applicationStatus === 'pending_review' || applicationStatus === 'approved'
  const normalizedSubdomain = useMemo(() => data.store.subdomain.trim().toLowerCase(), [data.store.subdomain])

  if (loading) {
    return <section className="store-wizard-shell" style={cardStyle}><p>Loading your saved application…</p></section>
  }

  if (isPending) {
    return (
      <section className="store-wizard-shell" style={cardStyle}>
        <div className="store-wizard-success-icon" aria-hidden="true">✓</div>
        <p className="store-wizard-kicker">Application received</p>
        <h2>{applicationStatus === 'approved' ? 'Your store is approved' : 'Your store is being reviewed'}</h2>
        <p className="store-wizard-description">
          {applicationStatus === 'approved'
            ? 'Your store has completed the application process.'
            : 'We will email you when the review is complete. You can safely leave this page.'}
        </p>
        <button type="button" className="secondary-btn" onClick={onCancel}>Back to profile</button>
      </section>
    )
  }

  return (
    <section className="store-wizard-shell" style={cardStyle}>
      <header className="store-wizard-header">
        <div>
          <p className="store-wizard-kicker">MarketSpace merchant onboarding</p>
          <h2>Open your store</h2>
          <p className="store-wizard-description">
            A guided setup, saved as you go. Your private identity details are never displayed on your storefront.
          </p>
        </div>
        <button type="button" className="ghost-btn" onClick={onCancel}>Exit setup</button>
      </header>

      <ol className="store-wizard-progress" aria-label="Store application progress">
        {STEP_TITLES.map((title, index) => (
          <li key={title} className={index + 1 === step ? 'active' : index + 1 < step ? 'complete' : ''}>
            <span>{index + 1 < step ? '✓' : index + 1}</span>
            <small>{title}</small>
          </li>
        ))}
      </ol>

      <div className="store-wizard-step-heading">
        <span>STEP {step} OF 6</span>
        <h3>{STEP_TITLES[step - 1]}</h3>
      </div>

      {error && <div role="alert" className="store-wizard-alert error">{error}</div>}
      {notice && <div role="status" className="store-wizard-alert notice">{notice}</div>}
      {rejectionReason && (
        <div role="status" className="store-wizard-alert error">
          Previous application feedback: {rejectionReason} Update the application and submit it again when ready.
        </div>
      )}

      {step === 1 && (
        <div className="store-wizard-fields">
          <p className="store-wizard-description">Verify your contact details before continuing.</p>
          <div className="store-wizard-account-email">
            <span>Email address</span>
            <strong>{email || 'Not available'}</strong>
          </div>
          <div className={emailVerified ? 'store-wizard-verification verified' : 'store-wizard-verification'}>
            <span>{emailVerified ? 'Email confirmed' : 'Email confirmation required'}</span>
            {!emailVerified && <button type="button" className="secondary-btn" onClick={() => void resendEmailConfirmation()}>Resend link</button>}
          </div>
          {!emailVerified && <button type="button" className="secondary-btn" onClick={() => void refreshAccountStatus()}>I confirmed my email — refresh status</button>}
          {PHONE_OTP_REQUIRED ? (
            <>
              <label>Phone number for OTP
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+260 971 234 567"
                  autoComplete="tel"
                />
              </label>
              {phoneVerified ? (
                <div className="store-wizard-verification verified">Phone number verified by Supabase Auth</div>
              ) : (
                <>
                  <button type="button" className="secondary-btn" disabled={saving || !emailVerified} onClick={() => void sendPhoneOtp()}>
                    {otpSent ? 'Send a new code' : 'Send phone verification code'}
                  </button>
                  {otpSent && (
                    <div className="store-wizard-inline">
                      <label>Verification code<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" /></label>
                      <button type="button" className="primary-btn" disabled={saving || !otp.trim()} onClick={() => void verifyPhoneOtp()}>Verify phone</button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="store-wizard-verification">Phone verification is not required for this application.</div>
          )}
          {TURNSTILE_SITE_KEY
            ? <TurnstileCaptcha key={captchaGeneration} onToken={receiveCaptchaToken} />
            : null}
        </div>
      )}

      {step === 2 && (
        <div className="store-wizard-fields">
          <p className="store-wizard-description">This information is private and used only for owner verification. Your ID number is hashed on the server and not retained.</p>
          <label>First name<input value={data.identity.firstName} onChange={(event) => {
            const firstName = event.target.value
            update('identity', { firstName, legalName: [firstName, data.identity.lastName].filter(Boolean).join(' ').trim() })
          }} autoComplete="given-name" /></label>
          <label>Last name<input value={data.identity.lastName} onChange={(event) => {
            const lastName = event.target.value
            update('identity', { lastName, legalName: [data.identity.firstName, lastName].filter(Boolean).join(' ').trim() })
          }} autoComplete="family-name" /></label>
          <label>Date of birth<input type="date" value={data.identity.dateOfBirth} onChange={(event) => update('identity', { dateOfBirth: event.target.value })} /></label>
          <label>Residential address<input type="text" value={data.identity.residentialAddress} onChange={(event) => update('identity', { residentialAddress: event.target.value })} autoComplete="street-address" /></label>
          <label>NRC number (9 digits)<input value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value.replace(/\D/g, '').slice(0, 9))} inputMode="numeric" pattern="[0-9]{9}" maxLength={9} autoComplete="off" required title="Enter exactly 9 digits." /></label>
          <div className="store-wizard-upload-grid">
            {renderPrivateUpload('Government ID photo', 'idImagePath', data.identity.idImagePath)}
            {renderPrivateUpload('Live selfie', 'selfiePath', data.identity.selfiePath)}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="store-wizard-fields">
          <label>Store name<input value={data.store.name} onChange={(event) => update('store', { name: event.target.value })} autoComplete="organization" /></label>
          <label>Store web address
            <div className="store-wizard-domain-input">
              <input
                value={data.store.subdomain}
                onChange={(event) => {
                  update('store', { subdomain: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                  setSubdomainState('idle')
                }}
                onBlur={() => { if (normalizedSubdomain.length >= 3) void checkSubdomain() }}
                placeholder="your-store"
                autoComplete="off"
              />
              <span>.{STORE_DOMAIN}</span>
            </div>
            {subdomainState === 'checking' && <small>Checking availability…</small>}
            {subdomainState === 'available' && <small className="store-wizard-positive">This store address is available.</small>}
            {subdomainState === 'taken' && <small className="store-wizard-negative">This store address is unavailable.</small>}
          </label>
          <label>Category
            <select value={data.store.category} onChange={(event) => update('store', { category: event.target.value })}>
              <option>Retail & Boutique</option><option>Electronics & Tech</option><option>Food & Catering</option>
              <option>Automotive & Services</option><option>Fashion & Apparel</option><option>Health & Beauty</option><option>Other</option>
            </select>
          </label>
          <label>Store description<textarea rows={4} value={data.store.description} onChange={(event) => update('store', { description: event.target.value })} /></label>
          <label>Store logo <span className="store-wizard-optional">Optional</span>
            <input type="file" accept="image/*" onChange={(event) => void uploadStoreLogo(event)} />
            {logoUploading && <small>Uploading logo…</small>}
            {data.store.logo && <img src={data.store.logo} alt="Store logo preview" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 12 }} />}
          </label>
          <label>Store type
            <select value={data.store.type} onChange={(event) => update('store', { type: event.target.value as RegistrationData['store']['type'] })}>
              <option value="physical">Physical storefront</option>
              <option value="online_delivery">Online with delivery</option>
              <option value="meetup_only">Online with safe meetups</option>
            </select>
          </label>
          <label>Customer support contact (email or WhatsApp)<input value={data.store.supportContact} onChange={(event) => update('store', { supportContact: event.target.value })} /></label>
          <label>Business registration number <span className="store-wizard-optional">Optional</span>
            <input value={data.store.businessRegistrationNumber} onChange={(event) => update('store', { businessRegistrationNumber: event.target.value })} />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="store-wizard-fields">
          <label>Marketplace location
            <select value={data.location.marketplaceLocation} onChange={(event) => update('location', { marketplaceLocation: event.target.value })} required>
              <option value="">Select a location</option>
              {STORE_MARKET_LOCATIONS.map(location => <option key={location} value={location}>{location}</option>)}
            </select>
          </label>
          {data.store.type === 'physical' ? (
            <>
              <label>Street address<input value={data.location.streetAddress} onChange={(event) => update('location', { streetAddress: event.target.value })} /></label>
              <details className="store-wizard-map-pin">
                <summary>Optional map pin <span>Not required for location verification</span></summary>
                <p className="store-wizard-help">You can search the store address to suggest a map pin. This is for map display only; it does not verify your location.</p>
                <button type="button" className="secondary-btn" disabled={searchingLocation} onClick={() => void searchAddress()}>
                  {searchingLocation ? 'Searching map…' : 'Find map pin from address'}
                </button>
                <div className="store-wizard-inline">
                  <label>Map latitude<input value={data.location.latitude} onChange={(event) => update('location', { latitude: event.target.value })} inputMode="decimal" /></label>
                  <label>Map longitude<input value={data.location.longitude} onChange={(event) => update('location', { longitude: event.target.value })} inputMode="decimal" /></label>
                </div>
              </details>
              <label>Opening hours<input value={data.location.openingHours} onChange={(event) => update('location', { openingHours: event.target.value })} placeholder="Mon–Sat, 08:00–18:00" /></label>
            </>
          ) : (
            <>
              {data.store.type === 'online_delivery' ? (
                <label>Delivery areas<textarea rows={3} value={data.location.deliveryAreas} onChange={(event) => update('location', { deliveryAreas: event.target.value })} placeholder="List towns, neighborhoods, or districts" /></label>
              ) : (
                <label>Safe meetup locations<textarea rows={3} value={data.location.safeMeetupLocations} onChange={(event) => update('location', { safeMeetupLocations: event.target.value })} placeholder="List public, well-lit meetup points" /></label>
              )}
            </>
          )}
          <label>Location verification method
            <select value={data.location.verificationMethod} onChange={(event) => update('location', { verificationMethod: event.target.value as 'photo' | 'video' })}>
              <option value="photo">Upload a store location photo</option>
              <option value="video">Request a video call with a reviewer</option>
            </select>
          </label>
          {data.location.verificationMethod === 'photo' ? (
            <>
              {renderPrivateUpload('Store location photo', 'proofPath', data.location.proofPath)}
              <p className="store-wizard-help">The photo is private and reviewed by an admin alongside your declared store address and marketplace location.</p>
            </>
          ) : (
            <p className="store-wizard-help">A moderator will contact you to arrange the verification call. Your application will remain in manual review.</p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="store-wizard-fields store-wizard-policy-list">
          <section className="store-wizard-terms">
            <h4>MarketSpace seller terms · Version {termsDocument?.version ?? 'unavailable'}</h4>
            {termsError
              ? <p role="alert">{termsError}</p>
              : termsDocument
              ? <div className="store-wizard-terms-content">{termsDocument.content}</div>
              : <p>Loading the current terms…</p>}
          </section>
          <p className="store-wizard-description">Set the policies customers will see for your store. MarketSpace’s platform terms are shown separately below.</p>
          <StorePoliciesEditor
            policies={data.policies.storePolicies}
            onChange={storePolicies => update('policies', { storePolicies })}
          />
          <label><input
            type="checkbox"
            checked={data.policies.termsAccepted && data.policies.termsAcceptedVersion === String(termsDocument?.version ?? '')}
            disabled={!termsDocument}
            onChange={(event) => update('policies', {
              termsAccepted: event.target.checked,
              termsAcceptedVersion: event.target.checked ? String(termsDocument?.version ?? '') : '',
            })}
          />
            <span>I have read and agree to the MarketSpace seller terms above (version {termsDocument?.version ?? 'unavailable'}).</span>
          </label>
          <label><input type="checkbox" checked={data.policies.prohibitedItemsAccepted} onChange={(event) => update('policies', { prohibitedItemsAccepted: event.target.checked })} />
            <span>I have read and will comply with the prohibited-items list (version {PROHIBITED_ITEMS_VERSION}).</span>
          </label>
        </div>
      )}

      {step === 6 && (
        <div className="store-wizard-review">
          <p>Check your details before sending the application. Your store remains private until reviewed.</p>
          <dl>
            <dt>Store name</dt><dd>{data.store.name || 'Not provided'}</dd>
            <dt>Store web address</dt><dd>{normalizedSubdomain || 'Not provided'}.{STORE_DOMAIN}</dd>
            <dt>Category & type</dt><dd>{data.store.category} · {data.store.type.replace('_', ' ')}</dd>
            <dt>Owner</dt><dd>{data.identity.legalName || 'Not provided'} · ID and selfie uploaded</dd>
            <dt>Location verification</dt><dd>{data.location.verificationMethod === 'photo' ? (data.location.proofPath ? 'Photo submitted for admin review' : 'Photo required') : 'Video call requested'}</dd>
          </dl>
          {data.policies.storePolicies.length > 0 && (
            <section aria-label="Your store policies">
              <h3>Your store policies</h3>
              {data.policies.storePolicies.map(policy => (
                <p key={policy.id}><strong>{policy.title}:</strong> {policy.content}</p>
              ))}
            </section>
          )}
          {TURNSTILE_SITE_KEY && <TurnstileCaptcha key={captchaGeneration} onToken={receiveCaptchaToken} />}
          <p className="store-wizard-help">Your application will be reviewed before the store is made public.</p>
          {rejectionReason && <p className="store-wizard-help">Previous reviewer feedback: {rejectionReason}</p>}
        </div>
      )}

      <footer className="store-wizard-actions">
        <button type="button" className="secondary-btn" onClick={() => { setError(''); setNotice(''); setCaptchaToken(''); setStep((current) => Math.max(current - 1, 1)) }} disabled={step === 1 || saving}>
          Back
        </button>
        <span>{saving ? 'Saving securely…' : 'Progress saves as you continue'}</span>
        {step < 6 ? (
          <button type="button" className="primary-btn" onClick={() => void validateStep()} disabled={saving || logoUploading}>
            Save & continue
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            onClick={() => void submitApplication()}
            disabled={saving || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)}
          >
            {saving ? 'Submitting…' : 'Submit application'}
          </button>
        )}
      </footer>
    </section>
  )
}
