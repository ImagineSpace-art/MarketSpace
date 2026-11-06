import { useEffect, useRef, useState } from 'react'

type TurnstileWidget = {
  render: (element: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': (errorCode: string | number) => boolean
  }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-turnstile-widget]')
    const shouldAppend = !script
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstileWidget = 'true'
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      script?.removeEventListener('load', handleLoad)
      script?.removeEventListener('error', handleError)
    }
    const handleLoad = () => {
      cleanup()
      if (window.turnstile) resolve()
      else reject(new Error('Turnstile did not initialize.'))
    }
    const handleError = () => {
      cleanup()
      if (shouldAppend) script?.remove()
      reject(new Error('Turnstile could not be downloaded.'))
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      if (shouldAppend) script?.remove()
      reject(new Error('Turnstile script loading timed out.'))
    }, 15000)

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (window.turnstile) handleLoad()
    else if (shouldAppend) document.head.appendChild(script)
  }).catch(error => {
    turnstileScriptPromise = null
    throw error
  })

  return turnstileScriptPromise
}

export function TurnstileCaptcha({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  const [attempt, setAttempt] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let widgetId: string | undefined
    let cancelled = false

    void (async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !window.turnstile || !containerRef.current) return
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: token => {
            setErrorMessage('')
            setVerified(true)
            onToken(token)
          },
          'expired-callback': () => {
            setVerified(false)
            onToken('')
          },
          'error-callback': errorCode => {
            setVerified(false)
            onToken('')
            setErrorMessage(`Cloudflare could not complete its security check (error ${errorCode}). Check your connection, browser extensions, and the Turnstile configuration, then retry.`)
            return true
          },
        })
      } catch {
        if (!cancelled) {
          setVerified(false)
          onToken('')
          setErrorMessage('The CAPTCHA could not load. Check that your browser or network allows challenges.cloudflare.com, then retry.')
        }
      }
    })()

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [attempt, onToken, siteKey])

  if (!siteKey) return null
  return (
    <div>
      <div ref={containerRef} aria-label="CAPTCHA verification" />
      {errorMessage ? (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <span>{errorMessage}</span>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setErrorMessage('')
              setVerified(false)
              onToken('')
              setAttempt(value => value + 1)
            }}
          >
            Retry CAPTCHA
          </button>
        </div>
      ) : verified ? (
        <p role="status" aria-live="polite" style={{ margin: '6px 0', color: 'var(--text-secondary)', fontSize: '.85rem' }}>
          CAPTCHA verified.
        </p>
      ) : (
        <p role="status" aria-live="polite" style={{ margin: '6px 0', color: 'var(--text-secondary)', fontSize: '.85rem' }}>
          Loading CAPTCHA…
        </p>
      )}
    </div>
  )
}
