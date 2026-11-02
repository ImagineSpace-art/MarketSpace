import { supabase } from '../lib/supabaseClient'
import type { VisibilityBoost } from '../types'

const ANONYMOUS_VIEWER_KEY = 'marketspace-boost-viewer'
const VIEWER_LOCATION_KEY = 'marketspace-viewer-location-id'

export function getBoostViewerKey(userId?: string | null) {
  if (userId) return userId
  let key = window.localStorage.getItem(ANONYMOUS_VIEWER_KEY)
  if (!key) {
    key = crypto.randomUUID()
    window.localStorage.setItem(ANONYMOUS_VIEWER_KEY, key)
  }
  return key
}

export function getBoostViewerLocation() {
  return window.localStorage.getItem(VIEWER_LOCATION_KEY)
}

export function setBoostViewerLocation(locationId: string | null) {
  if (locationId) window.localStorage.setItem(VIEWER_LOCATION_KEY, locationId)
  else window.localStorage.removeItem(VIEWER_LOCATION_KEY)
  window.dispatchEvent(new CustomEvent('marketspace:boost-location-changed', { detail: locationId }))
}

export function boostAudienceBucket(viewerKey: string, targetType: string, targetId: string) {
  const key = `${viewerKey}:${targetType}:${targetId}`
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (Math.imul(hash, 31) + key.charCodeAt(index)) >>> 0
  }
  return hash % 100
}

export function isBoostAudienceMatch(
  boost: Pick<VisibilityBoost, 'target_type' | 'target_id' | 'reach_percent' | 'location_id' | 'starts_at' | 'ends_at' | 'status'>,
  viewerKey: string,
  viewerLocationId: string | null,
  now = Date.now(),
) {
  return boost.status === 'active'
    && Date.parse(boost.starts_at) <= now
    && Date.parse(boost.ends_at) > now
    && (!boost.location_id || boost.location_id === viewerLocationId)
    && boostAudienceBucket(viewerKey, boost.target_type, boost.target_id) < boost.reach_percent
}

export async function recordBoostEvent(
  boostId: string,
  eventType: 'impression' | 'click',
  viewerKey?: string,
  viewerLocationId = getBoostViewerLocation(),
) {
  let effectiveViewerKey = viewerKey
  if (!effectiveViewerKey) {
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw new Error(`Viewer session could not be checked: ${sessionError.message}`)
    effectiveViewerKey = getBoostViewerKey(data.session?.user.id)
  }
  const { data, error } = await supabase.rpc('record_boost_event', {
    p_boost_id: boostId,
    p_event_type: eventType,
    p_viewer_key: effectiveViewerKey,
    p_viewer_location_id: viewerLocationId,
  })
  if (error) throw new Error(`Boost ${eventType} could not be recorded: ${error.message}`)
  return Boolean(data)
}
