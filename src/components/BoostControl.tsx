import { useState } from 'react'
import { MARKETPLACE_LOCATIONS } from '../features/marketplace/storeLocations'
import { supabase } from '../lib/supabaseClient'
import type { VisibilityBoost } from '../types'

type BoostControlProps = {
  targetType: VisibilityBoost['target_type']
  targetId: string
  targetTitle: string
  eligible: boolean
}

const DURATION_OPTIONS = [
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
]

export function BoostControl({ targetType, targetId, targetTitle, eligible }: BoostControlProps) {
  const [expanded, setExpanded] = useState(false)
  const [reach, setReach] = useState(50)
  const [durationHours, setDurationHours] = useState(72)
  const [locationId, setLocationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submitBoost = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { error: boostError } = await supabase.rpc('create_visibility_boost', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_reach_percent: reach,
        p_duration_hours: durationHours,
        p_location_id: locationId || null,
      })
      if (boostError) throw new Error(boostError.message)
      setNotice('Boost started. Payment is simulated for this project.')
      setExpanded(false)
      window.dispatchEvent(new Event('marketspace:boost-created'))
    } catch (boostError) {
      setError(boostError instanceof Error ? boostError.message : 'The boost could not be started.')
    } finally {
      setBusy(false)
    }
  }

  if (!eligible) return null

  return (
    <div className="visibility-boost-control">
      {!expanded ? (
        <button type="button" className="secondary-btn compact-btn" onClick={() => setExpanded(true)}>
          Boost visibility
        </button>
      ) : (
        <div className="sidebar-card" style={{ display: 'grid', gap: 10, maxWidth: 380 }}>
          <strong>Boost {targetTitle}</strong>
          <p style={{ margin: 0 }}>Simulated payment: this boost starts immediately and ends after the selected duration.</p>
          <label>
            Reach: {reach}%
            <input type="range" min="10" max="100" step="10" value={reach} onChange={event => setReach(Number(event.target.value))} />
          </label>
          <label>
            Duration
            <select value={durationHours} onChange={event => setDurationHours(Number(event.target.value))}>
              {DURATION_OPTIONS.map(option => <option key={option.hours} value={option.hours}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Audience location (optional)
            <select value={locationId} onChange={event => setLocationId(event.target.value)}>
              <option value="">All locations</option>
              {MARKETPLACE_LOCATIONS.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          {notice && <p role="status">{notice}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="primary-btn" disabled={busy} onClick={() => void submitBoost()}>
              {busy ? 'Starting…' : 'Confirm simulated boost'}
            </button>
            <button type="button" className="secondary-btn" disabled={busy} onClick={() => setExpanded(false)}>Cancel</button>
          </div>
        </div>
      )}
      {notice && !expanded && <span role="status">{notice}</span>}
    </div>
  )
}
