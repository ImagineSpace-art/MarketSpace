import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Listing } from '../components/Listing'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'
import { supabase } from '../lib/supabaseClient'
import type { BusinessProfile, Listing as ListingData, Profile } from '../types'

type UserProfilePageProps = {
  profileUserId?: string
  profile: Profile | null
  userEmail: string
  sessionUserId?: string
  listings: ListingData[]
  businessProfile?: BusinessProfile | null
  followingIds: string[]
  savedIds: string[]
  onToggleFollow: (userId: string) => void
  onToggleSave: (listingId: number) => void
  onOpenListing: (listing: ListingData) => void
  onUploadAvatar: (url: string) => Promise<void>
  onUpdateUsername: (username: string) => Promise<void>
}

export function UserProfilePage({
  profileUserId,
  profile: ownProfile,
  userEmail,
  sessionUserId,
  listings,
  businessProfile,
  followingIds,
  savedIds,
  onToggleFollow,
  onToggleSave,
  onOpenListing,
  onUploadAvatar,
  onUpdateUsername,
}: UserProfilePageProps) {
  const { userId: routeUserId = '' } = useParams()
  const userId = profileUserId || routeUserId
  const isOwner = Boolean(sessionUserId && sessionUserId === userId)
  const [publicProfile, setPublicProfile] = useState<Profile | null>(null)
  const [loadedProfileUserId, setLoadedProfileUserId] = useState<string | null>(null)
  const [profileLoadError, setProfileLoadError] = useState<{ userId: string; message: string } | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (isOwner || !userId) return

    let active = true
    void supabase
      .from('public_profiles')
      .select('user_id, username, avatar_url, created_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error: profileError }) => {
        if (!active) return
      if (profileError) {
        setProfileLoadError({ userId, message: 'This profile could not be loaded.' })
        setPublicProfile(null)
      }
      else {
        setProfileLoadError(null)
        setPublicProfile(data as Profile | null)
      }
      setLoadedProfileUserId(userId)
      })
    return () => { active = false }
  }, [isOwner, userId])

  const profile = isOwner ? ownProfile : publicProfile
  const visibleProfileError = profileLoadError?.userId === userId ? profileLoadError.message : ''
  const loading = !isOwner && loadedProfileUserId !== userId
  const displayName = profile?.username || (isOwner ? userEmail.split('@')[0] : 'MarketSpace member')
  const profileListings = useMemo(() => listings.filter((listing) => {
    if (listing.user_id !== userId) return false
    if (isOwner) return true
    return !listing.status || ['active', 'available'].includes(listing.status.toLowerCase())
  }), [isOwner, listings, userId])

  const saveUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = username.trim()
    if (trimmed.length < 2) {
      setError('Your display name must have at least two characters.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onUpdateUsername(trimmed)
      setEditing(false)
      setNotice('Your profile details were updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Your profile could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setNotice('')
    try {
      const avatarUrl = await uploadImageToSupabase(file, 'marketspace-media', 'avatars')
      await onUploadAvatar(avatarUrl)
      setNotice('Your profile photo was updated.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Your profile photo could not be updated.')
    }
  }

  if (loading) return <section className="section-card">Loading profile…</section>
  if (!profile) {
    return (
      <section className="section-card user-profile-empty">
        <span className="material-icons" aria-hidden="true">person_search</span>
        <h1>Profile not found</h1>
        <p>{visibleProfileError || 'This MarketSpace profile is unavailable.'}</p>
      </section>
    )
  }

  return (
    <div className="user-profile-page">
      <section className="user-profile-hero">
        <div className="user-profile-cover" />
        <div className="user-profile-identity">
          <div className="user-profile-avatar-wrap">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`${displayName} profile`} className="user-profile-avatar" />
            ) : (
              <div className="user-profile-avatar user-profile-avatar-fallback">{displayName.slice(0, 1).toUpperCase()}</div>
            )}
            {isOwner && (
              <label className="user-profile-avatar-edit" title="Change profile photo">
                <input type="file" accept="image/*" onChange={(event) => void uploadAvatar(event)} />
                <span className="material-icons" aria-hidden="true">photo_camera</span>
                <span className="sr-only">Change profile photo</span>
              </label>
            )}
          </div>
          <div className="user-profile-heading">
            <p className="eyebrow">{isOwner ? 'Your MarketSpace profile' : 'MarketSpace member'}</p>
            <h1>{displayName}</h1>
            {isOwner && <p>{userEmail}</p>}
            <div className="user-profile-stats">
              <span><strong>{profileListings.length}</strong> {profileListings.length === 1 ? 'listing' : 'listings'}</span>
              {businessProfile && <span><span className="material-icons" aria-hidden="true">verified</span> Store owner</span>}
            </div>
          </div>
          <div className="user-profile-actions">
            {isOwner ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setUsername(profile.username || displayName)
                  setEditing((current) => !current)
                  setError('')
                }}
              >
                <span className="material-icons" aria-hidden="true">edit</span>
                {editing ? 'Cancel editing' : 'Edit profile'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={followingIds.includes(userId) ? 'secondary-btn' : 'primary-btn'}
                  onClick={() => onToggleFollow(userId)}
                  disabled={!sessionUserId || sessionUserId === userId}
                >
                  <span className="material-icons" aria-hidden="true">{followingIds.includes(userId) ? 'person_remove' : 'person_add'}</span>
                  {followingIds.includes(userId) ? 'Following' : 'Follow'}
                </button>
                {businessProfile && (
                  <Link className="secondary-btn user-profile-store-link" to={`/store/${userId}`}>
                    <span className="material-icons" aria-hidden="true">storefront</span>
                    Visit store
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        {editing && isOwner && (
          <form className="user-profile-edit-form" onSubmit={(event) => void saveUsername(event)}>
            <label>
              Display name
              <input value={username} maxLength={40} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        )}
        {error && <p role="alert" className="user-profile-message error">{error}</p>}
        {notice && <p role="status" className="user-profile-message">{notice}</p>}
      </section>

      <section className="user-profile-listings">
        <div className="user-profile-section-heading">
          <div>
            <p className="eyebrow">{isOwner ? 'Your marketplace' : 'Marketplace'}</p>
            <h2>{isOwner ? 'Your listings' : `${displayName}’s listings`}</h2>
          </div>
          <span>{profileListings.length} total</span>
        </div>
        {profileListings.length === 0 ? (
          <div className="user-profile-empty">
            <span className="material-icons" aria-hidden="true">inventory_2</span>
            <p>{isOwner ? 'Your listings will appear here when you publish them.' : 'This member has no public listings yet.'}</p>
          </div>
        ) : (
          <div className="marketplace-listing-grid">
            {profileListings.map((listing) => (
              <Listing
                key={listing.id}
                listing={listing}
                saved={savedIds.includes(String(listing.id))}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
