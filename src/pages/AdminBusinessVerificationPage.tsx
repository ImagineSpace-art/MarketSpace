import { useCallback, useEffect, useState } from 'react'
import { adminSupabase } from '../lib/adminSupabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import {
  BUSINESS_DOCUMENT_LABELS,
  isChallengeCodeLive,
  type BusinessDocumentType,
} from '../../supabase/functions/_shared/businessVerificationValidation'

type DocumentRow = {
  id: string
  doc_type: BusinessDocumentType
  doc_number: string
  status: 'pending' | 'verified' | 'rejected'
  reason: string | null
  created_at: string
  file_url: string | null
}

type VideoCheckRow = {
  id: string
  status: 'pending' | 'passed' | 'failed'
  challenge_code: string
  code_expires_at: string
  notes: string | null
  created_at: string
}

type EndorsementRow = {
  id: string
  endorser_name: string
  endorser_role: string
  endorser_phone: string
  status: 'pending' | 'confirmed' | 'not_confirmed'
  notes: string | null
  created_at: string
  letter_url: string | null
}

type StoreItem = {
  store_id: string
  shop_name: string
  subdomain: string | null
  is_own_store: boolean
  business_verified_at: string | null
  can_grant: boolean
  documents: DocumentRow[]
  video_checks: VideoCheckRow[]
  endorsements: EndorsementRow[]
}

type Scope = 'pending' | 'verified'

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  color: 'var(--text)',
}

const blockStyle = {
  padding: '14px',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  display: 'grid',
  gap: '10px',
}

function statusText(status: string) {
  return status.replaceAll('_', ' ')
}

function StoreVerificationCard({ item, onChanged }: { item: StoreItem; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [checkedSource, setCheckedSource] = useState(false)
  const [documentReason, setDocumentReason] = useState('')
  const [originalsSeen, setOriginalsSeen] = useState(false)
  const [shopShown, setShopShown] = useState(false)
  const [codeMatched, setCodeMatched] = useState(false)
  const [videoNotes, setVideoNotes] = useState('')
  const [phoned, setPhoned] = useState(false)
  const [endorsementNotes, setEndorsementNotes] = useState('')
  const [revokeReason, setRevokeReason] = useState('')

  const act = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    try {
      const { error: invokeError } = await adminSupabase.functions.invoke('business-verification', { body })
      if (invokeError) throw new Error(await getFunctionErrorMessage(invokeError))
      setCheckedSource(false)
      setDocumentReason('')
      setOriginalsSeen(false)
      setShopShown(false)
      setCodeMatched(false)
      setVideoNotes('')
      setPhoned(false)
      setEndorsementNotes('')
      setRevokeReason('')
      onChanged()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const pendingDocument = item.documents.find(row => row.status === 'pending')
  const verifiedDocument = item.documents.find(row => row.status === 'verified')
  const latestVideo = item.video_checks[0]
  const pendingVideo = latestVideo?.status === 'pending' ? latestVideo : undefined
  const passedVideo = item.video_checks.find(row => row.status === 'passed')
  const pendingEndorsement = item.endorsements.find(row => row.status === 'pending')
  const confirmedEndorsement = item.endorsements.find(row => row.status === 'confirmed')
  const locked = busy || item.is_own_store
  const isVerified = Boolean(item.business_verified_at)

  return (
    <article className="section-card" style={{ display: 'grid', gap: '14px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0 }}>{item.shop_name}</h3>
          {item.subdomain && <small>{item.subdomain}</small>}
        </div>
        {isVerified && <strong style={{ color: '#059669' }}>Business verified</strong>}
      </header>

      {item.is_own_store && <p role="note">This is your own store. Another moderator must review it.</p>}
      {error && <p role="alert" className="store-wizard-alert error">{error}</p>}

      <div style={blockStyle}>
        <strong>1. Business document — {verifiedDocument ? 'verified' : pendingDocument ? 'pending review' : item.documents[0] ? statusText(item.documents[0].status) : 'none submitted'}</strong>
        {item.documents.slice(0, 3).map(row => (
          <div key={row.id} style={{ display: 'grid', gap: '4px' }}>
            <span>
              {BUSINESS_DOCUMENT_LABELS[row.doc_type] || row.doc_type} · <strong>{row.doc_number}</strong> · {statusText(row.status)}
            </span>
            {row.reason && <small>Reason: {row.reason}</small>}
            {row.file_url && <a href={row.file_url} target="_blank" rel="noreferrer">Open document photo (link expires in 10 minutes)</a>}
          </div>
        ))}
        {pendingDocument && !isVerified && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={checkedSource} onChange={event => setCheckedSource(event.target.checked)} />
              <span>I checked this number against the official source or the issuing office.</span>
            </label>
            <input
              type="text"
              placeholder="Reason (required to reject)"
              value={documentReason}
              maxLength={500}
              onChange={event => setDocumentReason(event.target.value)}
              style={fieldStyle}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-btn compact-btn"
                disabled={locked || !checkedSource}
                onClick={() => void act({ action: 'review_document', documentId: pendingDocument.id, decision: 'verified', checkedAgainstSource: checkedSource })}
              >
                Verify document
              </button>
              <button
                type="button"
                className="secondary-btn compact-btn"
                disabled={locked || !documentReason.trim()}
                onClick={() => void act({ action: 'review_document', documentId: pendingDocument.id, decision: 'rejected', reason: documentReason })}
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={blockStyle}>
        <strong>2. Video call — {passedVideo ? 'passed' : pendingVideo ? 'in progress' : latestVideo ? statusText(latestVideo.status) : 'not started'}</strong>
        {!pendingVideo && !isVerified && (
          <div style={{ display: 'grid', gap: '6px' }}>
            {latestVideo?.status === 'failed' && latestVideo.notes && <small>Last check failed: {latestVideo.notes}</small>}
            <button
              type="button"
              className="secondary-btn compact-btn"
              disabled={locked}
              onClick={() => void act({ action: 'start_video_check', storeId: item.store_id })}
            >
              Start video check (generates a live code)
            </button>
            {!verifiedDocument && <small>Tip: verify the document first so you can compare it with the originals on the call.</small>}
          </div>
        )}
        {pendingVideo && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <p>
              Ask the seller to write this code on paper and hold it in front of the shop:{' '}
              <strong style={{ fontSize: '1.4rem', letterSpacing: '0.08em' }}>{pendingVideo.challenge_code}</strong>
              {' '}({isChallengeCodeLive(pendingVideo.code_expires_at)
                ? `valid until ${new Date(pendingVideo.code_expires_at).toLocaleTimeString()}`
                : 'expired — start a new check'})
            </p>
            <label style={{ display: 'flex', gap: '8px' }}>
              <input type="checkbox" checked={originalsSeen} onChange={event => setOriginalsSeen(event.target.checked)} />
              <span>I saw the original documents and they match the uploaded photos.</span>
            </label>
            <label style={{ display: 'flex', gap: '8px' }}>
              <input type="checkbox" checked={shopShown} onChange={event => setShopShown(event.target.checked)} />
              <span>The seller showed the shop sign, goods and location on camera.</span>
            </label>
            <label style={{ display: 'flex', gap: '8px' }}>
              <input type="checkbox" checked={codeMatched} onChange={event => setCodeMatched(event.target.checked)} />
              <span>The code shown matches the code above.</span>
            </label>
            <input
              type="text"
              placeholder="Notes (required if the check fails)"
              value={videoNotes}
              maxLength={500}
              onChange={event => setVideoNotes(event.target.value)}
              style={fieldStyle}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-btn compact-btn"
                disabled={locked || !originalsSeen || !shopShown || !codeMatched || !isChallengeCodeLive(pendingVideo.code_expires_at)}
                onClick={() => void act({ action: 'record_video_check', checkId: pendingVideo.id, decision: 'passed', originalsSeen, shopShown, codeMatched, notes: videoNotes })}
              >
                Pass video check
              </button>
              <button
                type="button"
                className="secondary-btn compact-btn"
                disabled={locked || !videoNotes.trim()}
                onClick={() => void act({ action: 'record_video_check', checkId: pendingVideo.id, decision: 'failed', originalsSeen, shopShown, codeMatched, notes: videoNotes })}
              >
                Fail video check
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={blockStyle}>
        <strong>3. Endorsement — {confirmedEndorsement ? 'confirmed' : pendingEndorsement ? 'pending review' : item.endorsements[0] ? statusText(item.endorsements[0].status) : 'none submitted'}</strong>
        {item.endorsements.slice(0, 3).map(row => (
          <div key={row.id} style={{ display: 'grid', gap: '4px' }}>
            <span>
              {row.endorser_name}, {row.endorser_role} · <a href={`tel:${row.endorser_phone.replace(/\s/g, '')}`}>{row.endorser_phone}</a> · {statusText(row.status)}
            </span>
            {row.notes && <small>Notes: {row.notes}</small>}
            {row.letter_url && <a href={row.letter_url} target="_blank" rel="noreferrer">Open endorsement letter (link expires in 10 minutes)</a>}
          </div>
        ))}
        {pendingEndorsement && !isVerified && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={phoned} onChange={event => setPhoned(event.target.checked)} />
              <span>I phoned the endorser and they confirmed they know this shop and wrote the letter.</span>
            </label>
            <input
              type="text"
              placeholder="Notes (required if not confirmed)"
              value={endorsementNotes}
              maxLength={500}
              onChange={event => setEndorsementNotes(event.target.value)}
              style={fieldStyle}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-btn compact-btn"
                disabled={locked || !phoned}
                onClick={() => void act({ action: 'review_endorsement', endorsementId: pendingEndorsement.id, decision: 'confirmed', phoned, notes: endorsementNotes })}
              >
                Confirm endorsement
              </button>
              <button
                type="button"
                className="secondary-btn compact-btn"
                disabled={locked || !endorsementNotes.trim()}
                onClick={() => void act({ action: 'review_endorsement', endorsementId: pendingEndorsement.id, decision: 'not_confirmed', phoned, notes: endorsementNotes })}
              >
                Not confirmed
              </button>
            </div>
          </div>
        )}
      </div>

      {isVerified ? (
        <div style={{ display: 'grid', gap: '8px' }}>
          <input
            type="text"
            placeholder="Reason for removing the badge (required)"
            value={revokeReason}
            maxLength={500}
            onChange={event => setRevokeReason(event.target.value)}
            style={fieldStyle}
          />
          <button
            type="button"
            className="secondary-btn compact-btn"
            disabled={locked || !revokeReason.trim()}
            onClick={() => void act({ action: 'revoke', storeId: item.store_id, reason: revokeReason })}
          >
            Remove Business verified badge
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="primary-btn"
            disabled={locked || !item.can_grant}
            onClick={() => void act({ action: 'grant', storeId: item.store_id })}
          >
            Grant Business verified
          </button>
          {!item.can_grant && <small style={{ marginLeft: '10px' }}>Available when the document, video check and endorsement have all passed.</small>}
        </div>
      )}
    </article>
  )
}

export function AdminBusinessVerificationPage() {
  const [scope, setScope] = useState<Scope>('pending')
  const [stores, setStores] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (nextScope: Scope) => {
    setError('')
    try {
      const { data, error: invokeError } = await adminSupabase.functions.invoke<{ stores: StoreItem[] }>('business-verification', {
        body: { action: 'queue', scope: nextScope },
      })
      if (invokeError) throw new Error(await getFunctionErrorMessage(invokeError))
      setStores(data?.stores || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The business verification queue could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(scope) }, 0)
    return () => window.clearTimeout(timer)
  }, [load, scope])

  return (
    <section className="admin-queue-page">
      <header className="admin-queue-heading">
        <div>
          <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
          <h2>Business verification</h2>
          <p>A store earns the Business verified badge only when its document, video call and endorsement have all passed.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={() => { setLoading(true); void load(scope) }}>
          Refresh
        </button>
      </header>

      <div className="listing-filters" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {(['pending', 'verified'] as const).map(value => (
          <button
            key={value}
            type="button"
            className={`filter-pill ${scope === value ? 'active' : ''}`}
            onClick={() => { setLoading(true); setScope(value) }}
          >
            {value === 'pending' ? 'In progress' : 'Verified'}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
      {loading ? (
        <section className="section-card"><p>Loading business verification…</p></section>
      ) : stores.length === 0 ? (
        <section className="section-card">
          <p>{scope === 'pending' ? 'No stores are waiting for business verification.' : 'No stores are business verified yet.'}</p>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {stores.map(item => (
            <StoreVerificationCard key={item.store_id} item={item} onChanged={() => void load(scope)} />
          ))}
        </div>
      )}
    </section>
  )
}
