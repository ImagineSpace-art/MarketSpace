import { useCallback, useEffect, useState } from 'react'
import { adminSupabase } from '../lib/adminSupabaseClient'

type TermsVersion = {
  version: number
  content: string
  published_at: string
  published_by: string | null
}

export function AdminTermsPage({ role }: { role: 'moderator' | 'admin' }) {
  const [versions, setVersions] = useState<TermsVersion[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadTerms = useCallback(async () => {
    setError('')
    setLoading(true)
    const { data, error: loadError } = await adminSupabase
      .from('marketspace_terms')
      .select('version, content, published_at, published_by')
      .order('version', { ascending: false })
    if (loadError) setError(`Terms could not be loaded: ${loadError.message}`)
    else {
      const loaded = data || []
      setVersions(loaded)
      setContent(current => current || loaded[0]?.content || '')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTerms() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadTerms])

  const publish = async () => {
    setError('')
    setNotice('')
    if (role !== 'admin') {
      setError('Only an administrator can publish MarketSpace terms.')
      return
    }
    const trimmed = content.trim()
    if (trimmed.length < 100) {
      setError('Terms must contain at least 100 characters.')
      return
    }
    if (trimmed.length > 20000) {
      setError('Terms cannot exceed 20,000 characters.')
      return
    }
    const { data: userData, error: userError } = await adminSupabase.auth.getUser()
    if (userError || !userData.user) {
      setError('The administrator session could not be verified.')
      return
    }

    setPublishing(true)
    const version = (versions[0]?.version || 0) + 1
    const { error: publishError } = await adminSupabase.from('marketspace_terms').insert({
      version,
      content: trimmed,
      published_by: userData.user.id,
    })
    if (publishError) {
      setError(`Terms could not be published: ${publishError.message}`)
    } else {
      setNotice(`MarketSpace terms version ${version} is now published.`)
      await loadTerms()
    }
    setPublishing(false)
  }

  return (
    <section style={{ width: 'min(100%, 1000px)', margin: '0 auto', padding: 20 }}>
      <header style={{ marginBottom: 16 }}>
        <p className="admin-eyebrow">MARKETSPACE ADMINISTRATION</p>
        <h2>MarketSpace Terms of Service</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Published terms are visible to users. Every publication creates a new, immutable version.
          Sellers must review and accept the current version before submitting a store application.
        </p>
      </header>
      <p role="note" className="store-wizard-alert">
        These terms are a plain-language project draft, not legal advice. Have qualified counsel review them before production use.
      </p>
      {error && <p role="alert" className="store-wizard-alert error">{error}</p>}
      {notice && <p role="status" className="store-wizard-alert notice">{notice}</p>}
      {loading ? <p>Loading published terms…</p> : (
        <>
          <label style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
            <span>Terms text</span>
            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={22}
              maxLength={20000}
              disabled={role !== 'admin' || publishing}
              style={{ width: '100%', boxSizing: 'border-box', padding: 14, font: 'inherit', lineHeight: 1.5 }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Current version: {versions[0]?.version ?? 'none'} · {content.length}/20,000 characters
            </span>
            {role === 'admin' && (
              <button type="button" className="primary-btn" disabled={publishing || loading} onClick={() => void publish()}>
                {publishing ? 'Publishing…' : `Publish version ${(versions[0]?.version || 0) + 1}`}
              </button>
            )}
          </div>
          <h3 style={{ marginTop: 28 }}>Previous versions</h3>
          {versions.length > 1 ? (
            <ol>
              {versions.slice(1).map(item => (
                <li key={item.version}>
                  Version {item.version} · published {new Date(item.published_at).toLocaleString()}
                </li>
              ))}
            </ol>
          ) : <p>No previous versions.</p>}
        </>
      )}
    </section>
  )
}
