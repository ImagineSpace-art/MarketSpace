import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type SiteAnnouncement = {
  id: string
  title: string
  body: string
}

export function SiteAnnouncementBar() {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null)
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const bodyRef = useRef<HTMLSpanElement>(null)

  const loadAnnouncement = useCallback(async () => {
    try {
      const { data, error: loadError } = await supabase
        .from('site_announcements')
        .select('id, title, body')
        .eq('is_active', true)
        .maybeSingle()
      if (loadError) throw loadError
      setError('')
      setAnnouncement(data)
      setIsDialogOpen(false)
    } catch (loadError) {
      console.error('Site announcements could not be loaded:', loadError)
      setError('Announcements are temporarily unavailable.')
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadAnnouncement() }, 0)
    const intervalId = window.setInterval(() => { void loadAnnouncement() }, 60_000)
    const refresh = () => { void loadAnnouncement() }
    window.addEventListener('marketspace:announcement-updated', refresh)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(intervalId)
      window.removeEventListener('marketspace:announcement-updated', refresh)
    }
  }, [loadAnnouncement])

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setIsTruncated(body.scrollWidth > body.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [announcement?.body])

  useEffect(() => {
    if (!isDialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDialogOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isDialogOpen])

  if (error) {
    return <div className="site-announcement-error" role="alert">{error}</div>
  }
  if (!announcement) return null

  return (
    <>
      <div className="site-announcement-bar" aria-live="polite">
        <span className="site-announcement-message" ref={bodyRef}>{announcement.body}</span>
        {isTruncated && (
          <button type="button" className="site-announcement-learn-more" onClick={() => setIsDialogOpen(true)}>
            Learn more
          </button>
        )}
      </div>
      {isDialogOpen && (
        <div
          className="site-announcement-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsDialogOpen(false)
          }}
        >
          <section
            className="site-announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-announcement-title"
          >
            <button type="button" className="site-announcement-close" aria-label="Close announcement" onClick={() => setIsDialogOpen(false)}>
              <span className="material-icons" aria-hidden="true">close</span>
            </button>
            <p className="admin-eyebrow">MARKETSPACE ANNOUNCEMENT</p>
            <h2 id="site-announcement-title">{announcement.title}</h2>
            <p>{announcement.body}</p>
          </section>
        </div>
      )}
    </>
  )
}
