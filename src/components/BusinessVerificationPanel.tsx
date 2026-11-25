import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import { randomId } from '../utils/randomId'
import { makeMetadataFreeImage } from '../features/marketplace/metadataFreeImage'
import {
  BUSINESS_DOCUMENT_LABELS,
  BUSINESS_DOCUMENT_TYPES,
  isValidDocumentNumber,
  isValidEndorserPhone,
  type BusinessDocumentType,
} from '../../supabase/functions/_shared/businessVerificationValidation'

type DocumentRow = {
  id: string
  doc_type: BusinessDocumentType
  doc_number: string
  status: 'pending' | 'verified' | 'rejected'
  reason: string | null
}

type VideoCheck = {
  id: string
  status: 'pending' | 'passed' | 'failed'
  notes: string | null
  challengeCode: string | null
  codeExpiresAt: string | null
}

type EndorsementRow = {
  id: string
  endorser_name: string
  endorser_role: string
  status: 'pending' | 'confirmed' | 'not_confirmed'
  notes: string | null
}

type StatusResponse = {
  store: {
    id: string
    shopName: string
    approved: boolean
    live: boolean
    awaitingVerification: boolean
    businessVerifiedAt: string | null
  } | null
  documents?: DocumentRow[]
  videoCheck?: VideoCheck | null
  endorsements?: EndorsementRow[]
}

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  color: 'var(--text)',
}

const stepStyle = {
  padding: '14px',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  background: 'var(--surface)',
  display: 'grid',
  gap: '10px',
}

function stepLabel(status: string | undefined) {
  if (status === 'verified' || status === 'passed' || status === 'confirmed') return 'Passed'
  if (status === 'pending') return 'Waiting for review'
  if (status === 'rejected' || status === 'failed' || status === 'not_confirmed') return 'Not accepted'
  return 'Not started'
}

async function uploadEvidence(file: File, kind: 'document' | 'endorsement') {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Sign in again before submitting verification evidence.')
  const blob = await makeMetadataFreeImage(file)
  const path = `${userData.user.id}/business/${kind}/${randomId()}.jpg`
  const { error } = await supabase.storage.from('store-private').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

/**
 * Seller-side "Business verification" section. Three steps (document, video call,
 * endorsement) must all pass before a moderator can grant the Business verified badge.
 */
export function BusinessVerificationPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [docType, setDocType] = useState<BusinessDocumentType>('pacra_certificate')
  const [docNumber, setDocNumber] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docError, setDocError] = useState('')
  const [docBusy, setDocBusy] = useState(false)

  const [endorserName, setEndorserName] = useState('')
  const [endorserRole, setEndorserRole] = useState('')
  const [endorserPhone, setEndorserPhone] = useState('')
  const [letterFile, setLetterFile] = useState<File | null>(null)
  const [endorsementError, setEndorsementError] = useState('')
  const [endorsementBusy, setEndorsementBusy] = useState(false)

  const refresh = useCallback(() => setReloadKey(key => key + 1), [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<StatusResponse>('business-verification', {
          body: { action: 'status' },
        })
        if (error) throw new Error(await getFunctionErrorMessage(error))
        if (active) {
          setStatus(data ?? { store: null })
          setLoadError('')
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Business verification status could not be loaded.')
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reloadKey])

  // While a live-presence code is showing, keep the seller's view fresh during the call.
  const liveCode = status?.videoCheck?.challengeCode
  useEffect(() => {
    if (!liveCode) return
    const timer = window.setInterval(refresh, 20000)
    return () => window.clearInterval(timer)
  }, [liveCode, refresh])

  const submitDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!docFile) return
    if (!isValidDocumentNumber(docNumber)) {
      setDocError('Enter the document number (3 to 40 letters, numbers, spaces or - / . _).')
      return
    }
    setDocError('')
    setDocBusy(true)
    let path = ''
    try {
      path = await uploadEvidence(docFile, 'document')
      const { error } = await supabase.functions.invoke('business-verification', {
        body: { action: 'submit_document', docType, docNumber: docNumber.trim(), filePath: path },
      })
      if (error) throw new Error(await getFunctionErrorMessage(error))
      setDocNumber('')
      setDocFile(null)
      refresh()
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'Your document could not be submitted.')
    } finally {
      setDocBusy(false)
    }
  }

  const submitEndorsement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!letterFile) return
    if (!isValidEndorserPhone(endorserPhone)) {
      setEndorsementError('Enter a phone number with 9 to 15 digits.')
      return
    }
    setEndorsementError('')
    setEndorsementBusy(true)
    try {
      const letterPath = await uploadEvidence(letterFile, 'endorsement')
      const { error } = await supabase.functions.invoke('business-verification', {
        body: {
          action: 'submit_endorsement',
          endorserName: endorserName.trim(),
          endorserRole: endorserRole.trim(),
          endorserPhone: endorserPhone.trim(),
          letterPath,
        },
      })
      if (error) throw new Error(await getFunctionErrorMessage(error))
      setEndorserName('')
      setEndorserRole('')
      setEndorserPhone('')
      setLetterFile(null)
      refresh()
    } catch (error) {
      setEndorsementError(error instanceof Error ? error.message : 'Your endorsement could not be submitted.')
    } finally {
      setEndorsementBusy(false)
    }
  }

  if (isLoading) return <p role="status">Loading business verification…</p>
  if (loadError) {
    return (
      <section className="setting-box" aria-labelledby="business-verification-title">
        <h3 id="business-verification-title">Business verification</h3>
        <p role="alert">{loadError}</p>
        <button type="button" className="secondary-btn" onClick={() => { setIsLoading(true); refresh() }}>
          Retry
        </button>
      </section>
    )
  }
  if (!status?.store || !status.store.approved) return null

  if (status.store.businessVerifiedAt) {
    return (
      <section className="setting-box" aria-labelledby="business-verification-title">
        <h3 id="business-verification-title">Business verification</h3>
        <p role="status">
          Your store is <strong>Business verified</strong> (since {new Date(status.store.businessVerifiedAt).toLocaleDateString()}).
          It is live, and the badge shows on your storefront and listings.
        </p>
      </section>
    )
  }

  const documents = status.documents || []
  const endorsements = status.endorsements || []
  const latestDocument = documents[0]
  const latestEndorsement = endorsements[0]
  const verifiedDocument = documents.find(row => row.status === 'verified')
  const confirmedEndorsement = endorsements.find(row => row.status === 'confirmed')
  const video = status.videoCheck
  const documentDone = Boolean(verifiedDocument)
  const endorsementDone = Boolean(confirmedEndorsement)
  const videoDone = video?.status === 'passed'

  return (
    <section className="setting-box" aria-labelledby="business-verification-title" style={{ display: 'grid', gap: '14px' }}>
      <div>
        <h3 id="business-verification-title">
          {status.store.awaitingVerification ? 'Finish verification to take your store live' : 'Get Business verified'}
        </h3>
        {status.store.awaitingVerification && (
          <p role="status" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
            <strong>Your application was approved, but your store is not live yet.</strong> To keep fake stores off
            MarketSpace, it will not be hosted until all three steps below are complete and a moderator has verified them.
          </p>
        )}
        <p>
          Shoppers trust stores that are proven to exist. Complete all three steps and a moderator will{' '}
          {status.store.awaitingVerification ? 'take your store live with' : 'add'} the “Business verified” badge.
          Photos are stored privately and only moderators can see them.
        </p>
      </div>

      <div style={stepStyle}>
        <strong>1. Business document — {documentDone ? 'Passed' : stepLabel(latestDocument?.status)}</strong>
        {latestDocument?.status === 'rejected' && latestDocument.reason && (
          <p role="status">Not accepted: {latestDocument.reason} You can submit it again.</p>
        )}
        {documentDone || latestDocument?.status === 'pending' ? (
          <p>
            {BUSINESS_DOCUMENT_LABELS[(verifiedDocument || latestDocument).doc_type]} · {(verifiedDocument || latestDocument).doc_number}
          </p>
        ) : (
          <form onSubmit={event => void submitDocument(event)} style={{ display: 'grid', gap: '10px' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              Document type
              <select value={docType} onChange={event => setDocType(event.target.value as BusinessDocumentType)} style={inputStyle}>
                {BUSINESS_DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{BUSINESS_DOCUMENT_LABELS[type]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              Document number
              <input
                type="text"
                value={docNumber}
                onChange={event => setDocNumber(event.target.value)}
                maxLength={40}
                required
                autoComplete="off"
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              Clear photo of the document
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={event => setDocFile(event.target.files?.[0] ?? null)}
                required
                style={inputStyle}
              />
            </label>
            {docError && <p role="alert">{docError}</p>}
            <button type="submit" className="primary-btn compact-btn" disabled={docBusy || !docFile}>
              {docBusy ? 'Submitting…' : 'Submit document'}
            </button>
          </form>
        )}
      </div>

      <div style={stepStyle}>
        <strong>2. Video call — {videoDone ? 'Passed' : video ? stepLabel(video.status) : 'Not started'}</strong>
        {video?.challengeCode ? (
          <div role="status" style={{ display: 'grid', gap: '6px' }}>
            <p>A moderator has started your call check. Write this code on paper and hold it up in front of your shop on the call:</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.08em' }}>{video.challengeCode}</p>
            {video.codeExpiresAt && <small>Valid until {new Date(video.codeExpiresAt).toLocaleTimeString()}.</small>}
          </div>
        ) : video?.status === 'failed' && video.notes ? (
          <p role="status">Not accepted: {video.notes} A moderator will arrange another call.</p>
        ) : videoDone ? (
          <p>Your call check passed.</p>
        ) : (
          <p>
            After your document is accepted, a moderator will contact you to arrange a short video call. Have your
            original documents ready and be at your shop.
          </p>
        )}
      </div>

      <div style={stepStyle}>
        <strong>3. Endorsement — {endorsementDone ? 'Passed' : stepLabel(latestEndorsement?.status)}</strong>
        {latestEndorsement?.status === 'not_confirmed' && latestEndorsement.notes && (
          <p role="status">Not accepted: {latestEndorsement.notes} You can submit another endorsement.</p>
        )}
        {endorsementDone || latestEndorsement?.status === 'pending' ? (
          <p>{(confirmedEndorsement || latestEndorsement).endorser_name} · {(confirmedEndorsement || latestEndorsement).endorser_role}</p>
        ) : (
          <form onSubmit={event => void submitEndorsement(event)} style={{ display: 'grid', gap: '10px' }}>
            <p>
              Ask someone who knows your shop, such as a market association chairperson, a ward or council office,
              or your landlord, to write and sign a short letter saying your shop exists at this location. A
              moderator will phone them to confirm.
            </p>
            <label style={{ display: 'grid', gap: '6px' }}>
              Endorser’s full name
              <input type="text" value={endorserName} onChange={event => setEndorserName(event.target.value)} maxLength={100} required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              Their role (for example, market chairperson)
              <input type="text" value={endorserRole} onChange={event => setEndorserRole(event.target.value)} maxLength={100} required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              Their phone number
              <input
                type="tel"
                value={endorserPhone}
                onChange={event => setEndorserPhone(event.target.value.replace(/[^0-9+ ]/g, ''))}
                maxLength={16}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              Photo of the signed letter
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={event => setLetterFile(event.target.files?.[0] ?? null)}
                required
                style={inputStyle}
              />
            </label>
            {endorsementError && <p role="alert">{endorsementError}</p>}
            <button type="submit" className="primary-btn compact-btn" disabled={endorsementBusy || !letterFile}>
              {endorsementBusy ? 'Submitting…' : 'Submit endorsement'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
