import { useEffect, useRef, useState } from 'react'

export function useTopScrollExpandableHero() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [headerOffset, setHeaderOffset] = useState(0)
  const expandedRef = useRef(isExpanded)

  useEffect(() => {
    expandedRef.current = isExpanded
  }, [isExpanded])

  useEffect(() => {
    const header = document.querySelector('.site-header-bar')
    if (!header) return

    const updateHeaderOffset = () => setHeaderOffset(Math.ceil(header.getBoundingClientRect().height))
    updateHeaderOffset()

    const observer = new ResizeObserver(updateHeaderOffset)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let touchStartY: number | null = null
    let touchStartExpanded = false
    const scrollTop = () => window.scrollY <= 1
    const updateHero = (expanded: boolean) => {
      expandedRef.current = expanded
      setIsExpanded(expanded)
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < 12 || !scrollTop()) return

      if (event.deltaY < 0 && !expandedRef.current) {
        event.preventDefault()
        updateHero(true)
      } else if (event.deltaY > 0 && expandedRef.current) {
        event.preventDefault()
        updateHero(false)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = scrollTop() ? event.touches[0]?.clientY ?? null : null
      touchStartExpanded = expandedRef.current
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartY === null || !scrollTop()) return
      const currentY = event.touches[0]?.clientY
      if (currentY === undefined) return
      const deltaY = currentY - touchStartY

      if (touchStartExpanded && deltaY <= -1) {
        event.preventDefault()
        if (deltaY <= -36 && expandedRef.current) updateHero(false)
      } else if (!touchStartExpanded && deltaY >= 1) {
        event.preventDefault()
        if (deltaY >= 36 && !expandedRef.current) updateHero(true)
      }
    }

    const clearTouchStart = () => {
      touchStartY = null
      touchStartExpanded = false
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', clearTouchStart, { passive: true })
    window.addEventListener('touchcancel', clearTouchStart, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', clearTouchStart)
      window.removeEventListener('touchcancel', clearTouchStart)
    }
  }, [])

  return { isExpanded, setIsExpanded, headerOffset }
}
