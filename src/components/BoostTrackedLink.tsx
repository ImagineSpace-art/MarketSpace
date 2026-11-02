import { useEffect, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { recordBoostEvent } from '../utils/visibilityBoosts'

type BoostTrackedLinkProps = {
  href: string
  boostId?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
  onMouseEnter?: (event: MouseEvent<HTMLAnchorElement>) => void
  onMouseLeave?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function BoostTrackedLink({ href, boostId, className, style, children, onMouseEnter, onMouseLeave }: BoostTrackedLinkProps) {
  useEffect(() => {
    if (boostId) {
      void recordBoostEvent(boostId, 'impression')
        .catch(error => console.warn(error instanceof Error ? error.message : 'Boost impression could not be recorded.'))
    }
  }, [boostId])

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (!boostId || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    try {
      await recordBoostEvent(boostId, 'click')
    } catch (error) {
      console.warn(error instanceof Error ? error.message : 'Boost click could not be recorded.')
    }
    window.location.assign(href)
  }

  return <a href={href} className={className} style={style} onClick={handleClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</a>
}
