type Props = {
  /** Icon only, for tight spaces such as listing cards. */
  compact?: boolean
  size?: number
}

/** Shown only for stores a moderator has granted Business verified. */
export function BusinessVerifiedBadge({ compact = false, size = 14 }: Props) {
  return (
    <span
      title="Business verified: a moderator checked this store's business document, video call and endorsement"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 700, fontSize: compact ? undefined : '0.8rem' }}
    >
      <span className="material-icons" style={{ fontSize: `${size}px` }} aria-hidden={!compact}>verified_user</span>
      {compact ? <span className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Business verified</span> : 'Business verified'}
    </span>
  )
}
