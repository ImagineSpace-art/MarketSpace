import { useEffect, useRef } from 'react'

type TurnstileWidget = {
  render: (element: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
  }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

export function TurnstileCaptcha({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let widgetId: string | undefined
    let cancelled = false
    const mount = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }
    const scriptError = () => onToken('')

    if (window.turnstile) {
      mount()
    } else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile-widget]')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.dataset.turnstileWidget = 'true'
        document.head.appendChild(script)
      }
      script.addEventListener('load', mount)
      script.addEventListener('error', scriptError)
      return () => {
        cancelled = true
        script?.removeEventListener('load', mount)
        script?.removeEventListener('error', scriptError)
        if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
      }
    }

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [onToken, siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} aria-label="CAPTCHA verification" />
}
