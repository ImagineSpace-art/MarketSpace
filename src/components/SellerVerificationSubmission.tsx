import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import { makeMetadataFreeImage } from '../features/marketplace/metadataFreeImage'
import { isValidZambianNrc } from '../../supabase/functions/_shared/storeRegistrationValidation'

type VerificationStatus = {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  reason: string | null
  reviewedAt: string | null
  submittedAt: string | null
}

type Props = {
  onSubmitted?: () => void
}

const imageInputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  color: 'var(--text)',
}

export function SellerVerificationSubmission({ onSubmitted }: Props) {
  const [idNumber, setIdNumber] = useState('')
  const [idImage, setIdImage] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [verification, setVerification] = useState<VerificationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusLoadError, setStatusLoadError] = useState('')
  const [statusReloadKey, setStatusReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          verification?: VerificationStatus
        }>('seller-verification', { body: { action: 'status' } })
        if (error) throw new Error(await getFunctionErrorMessage(error))
        if (!data?.verification) throw new Error('Verification status could not be loaded.')
        if (active) setVerification(data.verification)
      } catch (error) {
        if (active) setStatusLoadError(error instanceof Error ? error.message : 'Verification status could not be loaded.')
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [statusReloadKey])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!idImage || !selfie || !consentAccepted) return
    if (!isValidZambianNrc(idNumber)) {
      setErrorMessage('Enter your 9-digit NRC number using numbers only.')
      return
    }
    setErrorMessage('')
    setIsSubmitting(true)

    const uploadedPaths: string[] = []
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Sign in again before submitting identity verification.')

      const [idBlob, selfieBlob] = await Promise.all([
        makeMetadataFreeImage(idImage),
        makeMetadataFreeImage(selfie),
      ])
      const idImagePath = `${userData.user.id}/seller-verification/id/${crypto.randomUUID()}.jpg`
      const selfiePath = `${userData.user.id}/seller-verification/selfie/${crypto.randomUUID()}.jpg`
      const storage = supabase.storage.from('store-private')

      const { error: idUploadError } = await storage.upload(idImagePath, idBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      })
      if (idUploadError) throw idUploadError
      uploadedPaths.push(idImagePath)

      const { error: selfieUploadError } = await storage.upload(selfiePath, selfieBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      })
      if (selfieUploadError) throw selfieUploadError
      uploadedPaths.push(selfiePath)

      const { data, error } = await supabase.functions.invoke<{
        status?: VerificationStatus['status']
        submittedAt?: string
      }>('seller-verification', {
        body: { action: 'submit', idNumber, idImagePath, selfiePath, consentAccepted },
      })
      if (error) throw new Error(await getFunctionErrorMessage(error))
      setVerification({
        status: data?.status ?? 'pending',
        reason: null,
        reviewedAt: null,
        submittedAt: data?.submittedAt ?? new Date().toISOString(),
      })
      setIdNumber('')
      setIdImage(null)
      setSelfie(null)
      setConsentAccepted(false)
      onSubmitted?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Your verification submission could not be completed.'
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from('store-private').remove(uploadedPaths)
        if (cleanupError) {
          setErrorMessage(`${message} The unsubmitted images could not be removed; please contact support.`)
        } else {
          setErrorMessage(message)
        }
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p role="status">Loading identity verification…</p>

  if (statusLoadError) {
    return (
      <section className="setting-box" aria-labelledby="seller-verification-status">
        <h3 id="seller-verification-status">Individual seller verification</h3>
        <p role="alert">{statusLoadError}</p>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setIsLoading(true)
            setStatusLoadError('')
            setStatusReloadKey(key => key + 1)
          }}
        >
          Retry loading status
        </button>
      </section>
    )
  }

  if (verification?.status === 'pending' || verification?.status === 'approved') {
    return (
      <section className="setting-box" aria-labelledby="seller-verification-status">
        <h3 id="seller-verification-status">Individual seller verification</h3>
        <p role="status">
          {verification.status === 'approved'
            ? 'Your identity has been verified.'
            : 'Your identity verification is waiting for review.'}
        </p>
      </section>
    )
  }

  return (
    <section className="setting-box" aria-labelledby="seller-verification-title">
      <h3 id="seller-verification-title">Verify your individual seller account</h3>
      {verification?.status === 'rejected' && verification.reason && (
        <p role="status">
          Previous submission was rejected: {verification.reason} You may correct the issue and submit again.
        </p>
      )}
      <p>Verification is required for certain higher-risk listing categories and increases your active listing allowance. Submit your 9-digit NRC number and a selfie for identity review.</p>
      <div
        role="note"
        style={{
          margin: '16px 0',
          padding: '12px 14px',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          background: 'var(--surface)',
          lineHeight: 1.5,
        }}
      >
        MarketSpace collects your ID number, ID image, and selfie to verify your identity and prevent fraud.
        Authorized MarketSpace moderators can review these materials. Images are stored privately, are not
        shown publicly, and are scheduled for deletion 30 days after a review decision. This processing is
        subject to Zambia&apos;s Data Protection Act, 2021.
      </div>
      <form onSubmit={event => void submit(event)} style={{ display: 'grid', gap: '14px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          NRC number (9 digits)
          <input
            type="text"
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]{9}"
            value={idNumber}
            onChange={event => setIdNumber(event.target.value.replace(/\D/g, '').slice(0, 9))}
            maxLength={9}
            required
            title="Enter exactly 9 digits."
            style={imageInputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          Photo of your ID
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => setIdImage(event.target.files?.[0] ?? null)}
            required
            style={imageInputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          Selfie
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => setSelfie(event.target.files?.[0] ?? null)}
            required
            style={imageInputStyle}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={event => setConsentAccepted(event.target.checked)}
            required
            style={{ marginTop: '4px' }}
          />
          <span>I have read this notice and consent to the described collection and review of my information.</span>
        </label>
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <button type="submit" className="primary-btn compact-btn" disabled={isSubmitting || !consentAccepted}>
          {isSubmitting ? 'Submitting…' : 'Submit for identity review'}
        </button>
      </form>
    </section>
  )
}
