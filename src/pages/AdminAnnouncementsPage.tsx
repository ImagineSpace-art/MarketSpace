import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { adminSupabase } from '../lib/adminSupabaseClient'
import './AdminAnnouncementsPage.css'

type SiteAnnouncement = {
  id: string
  title: string
  body: string
  created_at: string
}

export function AdminAnnouncementsPage() {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAnnouncement = useCallback(async () => {
    setError('')
    try {
      const { data, error: loadError } = await adminSupabase
        .from('site_announcements')
        .select('id, title, body, created_at')
        .eq('is_active', true)
        .maybeSingle()
      if (loadError) throw loadError
      setAnnouncement(data)
    } catch (loadError) {
      setError(`The active announcement could not be loaded: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAnnouncement() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadAnnouncement])

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const { error: publishError } = await adminSupabase.rpc('publish_site_announcement', {
        p_title: title,
        p_body: body,
      })
      if (publishError) throw publishError
      setTitle('')
      setBody('')
      setNotice('Announcement published. It is now visible across MarketSpace.')
      window.dispatchEvent(new Event('marketspace:announcement-updated'))
      await loadAnnouncement()
    } catch (publishError) {
      setError(`The announcement could not be published: ${publishError instanceof Error ? publishError.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const dismiss = async () => {
    if (!announcement) return
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const { error: dismissError } = await adminSupabase.rpc('dismiss_site_announcement', {
        p_announcement_id: announcement.id,
      })
      if (dismissError) throw dismissError
      setNotice('The announcement has been removed from the site.')
      window.dispatchEvent(new Event('marketspace:announcement-updated'))
      await loadAnnouncement()
    } catch (dismissError) {
      setError(`The announcement could not be dismissed: ${dismissError instanceof Error ? dismissError.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-announcements-page">
      <header className="admin-notifications-heading">
        <div>
          <p className="admin-eyebrow">MARKETSPACE MODERATION</p>
          <h2>Site announcement</h2>
          <p>Publish one active message for the top of every MarketSpace page, including store sites and the admin area.</p>
        </div>
      </header>
      {error && <p className="store-wizard-alert error" role="alert">{error}</p>}
      {notice && <p className="store-wizard-alert notice" role="status">{notice}</p>}

      <section className="admin-announcement-current" aria-labelledby="active-announcement-heading">
        <h3 id="active-announcement-heading">Currently published</h3>
        {loading ? <p>Loading announcement…</p> : announcement ? (
          <article>
            <div>
              <strong>{announcement.title}</strong>
              <p>{announcement.body}</p>
              <small>Published {new Date(announcement.created_at).toLocaleString()}</small>
            </div>
            <button type="button" className="secondary-btn" disabled={saving} onClick={() => void dismiss()}>
              Remove from site
            </button>
          </article>
        ) : <p>No announcement is currently published.</p>}
      </section>

      <form className="admin-announcement-form" onSubmit={event => void publish(event)}>
        <h3>Publish or replace announcement</h3>
        <p>Publishing replaces the current active message. The message appears on one line; long messages include a “Learn more” dialog.</p>
        <label>
          <span>Title</span>
          <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} required />
        </label>
        <label>
          <span>Full announcement</span>
          <textarea value={body} onChange={event => setBody(event.target.value)} maxLength={5000} rows={6} required />
        </label>
        <button type="submit" className="primary-btn" disabled={saving || loading}>
          {saving ? 'Publishing…' : 'Publish announcement'}
        </button>
      </form>
    </section>
  )
}
