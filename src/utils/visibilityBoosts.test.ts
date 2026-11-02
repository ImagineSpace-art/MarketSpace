import { describe, expect, it } from 'vitest'
import { boostAudienceBucket, isBoostAudienceMatch } from './visibilityBoosts'

describe('visibility boost audience', () => {
  const boost = {
    target_type: 'listing' as const,
    target_id: '42',
    reach_percent: 50,
    location_id: 'cairo-road',
    starts_at: '2026-11-02T10:00:00.000Z',
    ends_at: '2026-11-03T10:00:00.000Z',
    status: 'active' as const,
  }

  it('assigns the same viewer and item to a deterministic bucket', () => {
    expect(boostAudienceBucket('viewer-1', 'listing', '42'))
      .toBe(0)
    expect(boostAudienceBucket('viewer-1', 'listing', '42'))
      .not.toBe(boostAudienceBucket('viewer-2', 'listing', '42'))
  })

  it('requires the targeted viewer location to match', () => {
    expect(isBoostAudienceMatch(boost, 'viewer-1', 'cairo-road', Date.parse('2026-11-02T12:00:00Z')))
      .toBe(boostAudienceBucket('viewer-1', 'listing', '42') < 50)
    expect(isBoostAudienceMatch(boost, 'viewer-1', 'city-market', Date.parse('2026-11-02T12:00:00Z'))).toBe(false)
  })

  it('stops applying boosts before start and after expiry', () => {
    expect(isBoostAudienceMatch(boost, 'viewer-1', 'cairo-road', Date.parse('2026-11-02T09:00:00Z'))).toBe(false)
    expect(isBoostAudienceMatch(boost, 'viewer-1', 'cairo-road', Date.parse('2026-11-03T10:00:00Z'))).toBe(false)
  })
})
