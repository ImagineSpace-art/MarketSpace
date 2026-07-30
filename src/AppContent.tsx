import { type FormEvent, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import { Shell } from './components/Shell'
import { ProfilePanel } from './components/ProfilePanel'
import { useMarketplaceApp } from './features/marketplace/useMarketplaceApp'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage, ListingFormPage } from './pages/ListingPage'
import { SavedItemsPage } from './pages/SavedNotificationsPage'
import { MessagesPage } from './pages/MessagesPage'
import { AuthPage } from './pages/AuthenticationPage'
import { StoreViewPage } from './pages/StoreViewPage'
import { StoresPage } from './pages/StoresPage'
import { ProfilePage } from './pages/ProfilePage'
import { SellerProfilePage } from './pages/SellerProfilePage'
import type { Listing, Profile, BusinessProfile } from './types'

export function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const app = useMarketplaceApp()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const {
    session,
    theme,
    setTheme,
    profile,
    listings,
    stores,
    loading,
    message,
    authEmail,
    authPassword,
    authUsername,
    searchQuery,
    activeCategories,
    priceRange,
    distanceFilter,
    sortBy,
    showOnlyAvailable,
    savedIds,
    savedListings,
    myListings,
    notifications,
    chatThreads,
    activeChatId,
    chatDraft,
    canMessage,
    title,
    description,
    price,
    category,
    location: formLocation,
    status,
    listingType,
    condition,
    deliveryOption,
    setAuthEmail,
    setAuthPassword,
    setAuthUsername,
    setSearchQuery,
    toggleCategory,
    setPriceRange,
    setDistanceFilter,
    setSortBy,
    setShowOnlyAvailable,
    setChatDraft,
    setTitle,
    setDescription,
    setPrice,
    setCategory,
    setLocation,
    setStatus,
    setListingType,
    setCondition,
    setDeliveryOption,
    setCanMessage,
    setActiveChatId,
    userEmail,
    handleLogin,
    handleSignup,
    handleLogout,
    handleCreateListing,
    handleUpdateListing,
    openListing,
    openEditListing,
    toggleSave,
    markAllRead,
    sendInboxMessage,
    businessProfile,
    allBusinesses,
    setSelectedStore,
    uploadedImages,
    setUploadedImages,
    handleCreateOrUpdateBusiness,
    handleDeleteListing,
    handleRenewListing,
    handleUpdateListingStatus,
    handleUploadAvatar,
    cardSize,
    setCardSize,
    handleStartChat,
    availableColors,
    setAvailableColors,
    listingKindFilter,
    setListingKindFilter,
    followingIds,
    notifyStoreIds,
    toggleFollowStore,
    toggleNotifyStore,
  } = app

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg, #f8fafc)', color: 'var(--text, #0f172a)' }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spin-animation {
            animation: spin 1.5s linear infinite;
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <span className="material-icons spin-animation" style={{ fontSize: '48px', color: '#2563eb', display: 'inline-block' }}>sync</span>
          <p style={{ marginTop: '16px', fontWeight: 600, fontFamily: 'sans-serif' }}>Loading MarketSpace...</p>
        </div>
      </div>
    )
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (location.pathname === '/login' || location.pathname === '/auth') {
      await handleLogin()
      return
    }

    await handleSignup()
  }



  return (
    <>
      <Shell
        session={session}
        activeCategories={activeCategories}
        priceRange={priceRange}
        distanceFilter={distanceFilter}
        sortBy={sortBy}
        showOnlyAvailable={showOnlyAvailable}
        onCategoryToggle={toggleCategory}
        onPriceRangeChange={setPriceRange}
        onDistanceChange={setDistanceFilter}
        onSortChange={setSortBy}
        onAvailableToggle={() => setShowOnlyAvailable((value) => !value)}
        profile={profile}
        listingKindFilter={listingKindFilter}
        onListingKindChange={setListingKindFilter}
      >
        {message ? <div className="status-banner">{message}</div> : null}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                loading={loading}
                filteredListings={app.filteredListings}
                savedIds={savedIds}
                openListing={openListing}
                toggleSave={toggleSave}
                distanceFilter={distanceFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                cardSize={cardSize}
                toggleCategory={toggleCategory}
                activeCategories={activeCategories}
              />
            }
          />
          <Route
            path="/listings/:id"
            element={
              <ListingDetailRoute
                listings={listings}
                loading={loading}
                session={session}
                navigate={navigate}
                handleStartChat={handleStartChat}
                toggleSave={toggleSave}
                openEditListing={openEditListing}
                allBusinesses={allBusinesses}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ListingEditRoute
                listings={listings}
                loading={loading}
                navigate={navigate}
                handleUpdateListing={handleUpdateListing}
                title={title}
                description={description}
                price={price}
                category={category}
                location={formLocation}
                status={status}
                listingType={listingType}
                condition={condition}
                deliveryOption={deliveryOption}
                uploadedImages={uploadedImages}
                onUploadedImagesChange={setUploadedImages}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onPriceChange={setPrice}
                onCategoryChange={setCategory}
                onLocationChange={setLocation}
                onStatusChange={setStatus}
                onListingTypeChange={setListingType}
                onConditionChange={setCondition}
                onDeliveryOptionChange={setDeliveryOption}
                availableColors={availableColors}
                onAvailableColorsChange={setAvailableColors}
              />
            }
          />
          <Route
            path="/saved"
            element={
              <SavedItemsPage
                savedListings={savedListings}
                onOpenListing={openListing}
                onToggleSave={toggleSave}
              />
            }
          />
          <Route
            path="/stores"
            element={
              <StoresPage
                stores={stores}
                allBusinesses={allBusinesses}
                onVisitShop={(shop) => {
                  setSelectedStore(shop)
                  navigate(`/store/${shop.userId}`)
                }}
                onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                listingKindFilter={listingKindFilter}
                listings={listings}
              />
            }
          />
          <Route
            path="/store/:userId"
            element={
              <StoreViewRoute
                stores={stores}
                businessProfile={businessProfile}
                allBusinesses={allBusinesses}
                listings={listings}
                navigate={navigate}
                handleStartChat={handleStartChat}
                openListing={openListing}
                toggleSave={toggleSave}
                savedIds={savedIds}
                loading={loading}
                followingIds={followingIds}
                notifyStoreIds={notifyStoreIds}
                toggleFollowStore={toggleFollowStore}
                toggleNotifyStore={toggleNotifyStore}
                session={session}
                storeReviews={app.storeReviews}
                addStoreReview={app.addStoreReview}
                replyToStoreReview={app.replyToStoreReview}
              />
            }
          />
          <Route
            path="/seller/:userId"
            element={
              <SellerProfileRoute
                stores={stores}
                listings={listings}
                allBusinesses={allBusinesses}
                navigate={navigate}
                openListing={openListing}
                toggleSave={toggleSave}
                savedIds={savedIds}
              />
            }
          />
          <Route
            path="/profile/:tab?"
            element={
              <ProfileTabRoute
                session={session}
                profile={profile}
                userEmail={userEmail}
                myListings={myListings}
                listings={listings}
                savedListings={savedListings}
                savedIds={savedIds}
                businessProfile={businessProfile}
                allBusinesses={allBusinesses}
                followingIds={followingIds}
                notifyStoreIds={notifyStoreIds}
                onToggleFollowStore={toggleFollowStore}
                onToggleNotifyStore={toggleNotifyStore}
                onEditListing={openEditListing}
                onRenewListing={handleRenewListing}
                onDeleteListing={handleDeleteListing}
                onUpdateStatus={handleUpdateListingStatus}
                onUploadAvatar={handleUploadAvatar}
                onOpenListing={openListing}
                onToggleSave={toggleSave}
                onLogout={handleLogout}
                onOpenDashboardPanel={() => setIsProfilePanelOpen(true)}
                theme={theme}
                locationString={formLocation}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
                onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                onGoHome={() => navigate('/')}
                notifications={notifications}
                onMarkAllRead={markAllRead}
                currency={app.currency}
                setCurrency={app.setCurrency}
                notificationsConfig={app.notificationsConfig}
                setNotificationsConfig={app.setNotificationsConfig}
                blockedUserIds={app.blockedUserIds}
                toggleBlockUser={app.toggleBlockUser}
                paymentMethods={app.paymentMethods}
                addPaymentMethod={app.addPaymentMethod}
                removePaymentMethod={app.removePaymentMethod}
                browsingHistory={app.browsingHistory}
                clearBrowsingHistory={app.clearBrowsingHistory}
                searchHistory={app.searchHistory}
                clearSearchHistory={app.clearSearchHistory}
                createListingProps={{
                  title,
                  description,
                  price,
                  category,
                  location: formLocation,
                  status,
                  listingType,
                  condition,
                  deliveryOption,
                  uploadedImages,
                  onUploadedImagesChange: setUploadedImages,
                  onSubmit: handleCreateListing,
                  onTitleChange: setTitle,
                  onDescriptionChange: setDescription,
                  onPriceChange: setPrice,
                  onCategoryChange: setCategory,
                  onLocationChange: setLocation,
                  onStatusChange: setStatus,
                  onListingTypeChange: setListingType,
                  onConditionChange: setCondition,
                  onDeliveryOptionChange: setDeliveryOption,
                  availableColors,
                  onAvailableColorsChange: setAvailableColors,
                }}
                storeSetupProps={{
                  userId: session ? session.user.id : '',
                  onSave: handleCreateOrUpdateBusiness,
                }}
              />
            }
          />
          <Route
            path="/settings/:category?"
            element={
              <ProfileTabRoute
                session={session}
                profile={profile}
                userEmail={userEmail}
                myListings={myListings}
                listings={listings}
                savedListings={savedListings}
                savedIds={savedIds}
                businessProfile={businessProfile}
                allBusinesses={allBusinesses}
                followingIds={followingIds}
                notifyStoreIds={notifyStoreIds}
                onToggleFollowStore={toggleFollowStore}
                onToggleNotifyStore={toggleNotifyStore}
                onEditListing={openEditListing}
                onRenewListing={handleRenewListing}
                onDeleteListing={handleDeleteListing}
                onUpdateStatus={handleUpdateListingStatus}
                onUploadAvatar={handleUploadAvatar}
                onOpenListing={openListing}
                onToggleSave={toggleSave}
                onLogout={handleLogout}
                onOpenDashboardPanel={() => setIsProfilePanelOpen(true)}
                theme={theme}
                locationString={formLocation}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
                onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                onGoHome={() => navigate('/')}
                notifications={notifications}
                onMarkAllRead={markAllRead}
                currency={app.currency}
                setCurrency={app.setCurrency}
                notificationsConfig={app.notificationsConfig}
                setNotificationsConfig={app.setNotificationsConfig}
                blockedUserIds={app.blockedUserIds}
                toggleBlockUser={app.toggleBlockUser}
                paymentMethods={app.paymentMethods}
                addPaymentMethod={app.addPaymentMethod}
                removePaymentMethod={app.removePaymentMethod}
                browsingHistory={app.browsingHistory}
                clearBrowsingHistory={app.clearBrowsingHistory}
                searchHistory={app.searchHistory}
                clearSearchHistory={app.clearSearchHistory}
                createListingProps={{
                  title,
                  description,
                  price,
                  category,
                  location: formLocation,
                  status,
                  listingType,
                  condition,
                  deliveryOption,
                  uploadedImages,
                  onUploadedImagesChange: setUploadedImages,
                  onSubmit: handleCreateListing,
                  onTitleChange: setTitle,
                  onDescriptionChange: setDescription,
                  onPriceChange: setPrice,
                  onCategoryChange: setCategory,
                  onLocationChange: setLocation,
                  onStatusChange: setStatus,
                  onListingTypeChange: setListingType,
                  onConditionChange: setCondition,
                  onDeliveryOptionChange: setDeliveryOption,
                  availableColors,
                  onAvailableColorsChange: setAvailableColors,
                }}
                storeSetupProps={{
                  userId: session ? session.user.id : '',
                  onSave: handleCreateOrUpdateBusiness,
                }}
              />
            }
          />

          <Route
            path="/inbox"
            element={
              session ? (
                <MessagesPage
                  chatThreads={chatThreads}
                  activeChatId={activeChatId}
                  canMessage={canMessage}
                  chatDraft={chatDraft}
                  onSelectThread={setActiveChatId}
                  onToggleMute={() => setCanMessage((value) => !value)}
                  onDraftChange={setChatDraft}
                  onSendMessage={sendInboxMessage}
                  onTogglePinChat={app.togglePinChat}
                  onToggleFavoriteChat={app.toggleFavoriteChat}
                  onToggleArchiveChat={app.toggleArchiveChat}
                  onDeleteChat={app.deleteChat}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              <AuthPage
                mode="login"
                isSignedIn={Boolean(session)}
                userEmail={userEmail}
                authEmail={authEmail}
                authPassword={authPassword}
                authUsername={authUsername}
                onAuthEmailChange={setAuthEmail}
                onAuthPasswordChange={setAuthPassword}
                onAuthUsernameChange={setAuthUsername}
                onSubmit={handleAuthSubmit}
                onSwitchMode={() => navigate('/signup')}
                onLogout={handleLogout}
                onGoProfile={() => navigate('/profile')}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <AuthPage
                mode="signup"
                isSignedIn={Boolean(session)}
                userEmail={userEmail}
                authEmail={authEmail}
                authPassword={authPassword}
                authUsername={authUsername}
                onAuthEmailChange={setAuthEmail}
                onAuthPasswordChange={setAuthPassword}
                onAuthUsernameChange={setAuthUsername}
                onSubmit={handleAuthSubmit}
                onSwitchMode={() => navigate('/login')}
                onLogout={handleLogout}
                onGoProfile={() => navigate('/profile')}
              />
            }
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      <ProfilePanel
        isOpen={isProfilePanelOpen}
        onClose={() => setIsProfilePanelOpen(false)}
        profile={profile}
        userEmail={userEmail}
        myListings={myListings}
        businessProfile={businessProfile}
      />
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            zIndex: 999,
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          title="Back to Top"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span className="material-icons" style={{ fontSize: '24px' }}>arrow_upward</span>
        </button>
      )}
    </>
  )
}

// ---------------- ROUTE WRAPPERS DEFINED OUTSIDE APPCONTENT TO PREVENT FOCUS LOSS BUGS ----------------

function ProfileTabRoute({ session, ...props }: any) {
  const { tab } = useParams()
  const location = useLocation()
  const isSettingsPath = location.pathname.startsWith('/settings')
  const activeSection =
    isSettingsPath || tab === 'settings'
      ? 'settings'
      : tab === 'notifications'
        ? 'notifications'
        : tab === 'create'
          ? 'create'
          : tab === 'business-setup'
            ? 'business-setup'
            : tab === 'store-dashboard'
              ? 'store-dashboard'
              : tab === 'saved-listings'
                ? 'saved-listings'
                : 'dashboard'

  return session ? (
    <ProfilePage activeSection={activeSection} {...props} />
  ) : (
    <Navigate to="/login" replace />
  )
}

function ListingDetailRoute({ listings, loading, session, navigate, handleStartChat, toggleSave, openEditListing, allBusinesses }: { listings: Listing[]; loading: boolean; session: any; navigate: any; handleStartChat: any; toggleSave: any; openEditListing: any; allBusinesses: any }) {
  const { id } = useParams()
  const listing = listings.find((l: Listing) => String(l.id) === id)
  if (!listing) {
    if (loading) return <p style={{ padding: '24px' }}>Loading listing details...</p>
    return <p style={{ padding: '24px' }}>Listing not found.</p>
  }
  return (
    <ListingDetailPage
      selectedListing={listing}
      session={session}
      onBack={() => navigate('/')}
      onMessageSeller={(customMessage?: string) => {
        void handleStartChat(listing, customMessage)
      }}
      onToggleSave={toggleSave}
      onEditListing={openEditListing}
      allBusinesses={allBusinesses}
      onVisitStore={(userId) => navigate(`/store/${userId}`)}
    />
  )
}

function ListingEditRoute({
  listings,
  loading,
  navigate,
  handleUpdateListing,
  title,
  description,
  price,
  category,
  location,
  status,
  listingType,
  condition,
  deliveryOption,
  uploadedImages,
  onUploadedImagesChange,
  onTitleChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  onLocationChange,
  onStatusChange,
  onListingTypeChange,
  onConditionChange,
  onDeliveryOptionChange,
  availableColors,
  onAvailableColorsChange,
}: {
  listings: Listing[]
  loading: boolean
  navigate: any
  handleUpdateListing: any
  title: string
  description: string
  price: string
  category: string
  location: string
  status: string
  listingType: string
  condition: string
  deliveryOption: string
  uploadedImages: string[]
  onUploadedImagesChange: (images: string[]) => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPriceChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onStatusChange: (value: string) => void
  onListingTypeChange: (value: string) => void
  onConditionChange: (value: string) => void
  onDeliveryOptionChange: (value: string) => void
  availableColors: string[]
  onAvailableColorsChange: (colors: string[]) => void
}) {
  const { id } = useParams()
  const listing = listings.find((l: Listing) => String(l.id) === id)
  if (!listing) {
    if (loading) return <p style={{ padding: '24px' }}>Loading listing...</p>
    return <p style={{ padding: '24px' }}>Listing not found.</p>
  }
  return (
    <ListingFormPage
      mode="edit"
      onSubmit={handleUpdateListing}
      onCancel={() => navigate('/')}
      title={title}
      description={description}
      price={price}
      category={category}
      location={location}
      status={status}
      listingType={listingType}
      condition={condition}
      deliveryOption={deliveryOption}
      uploadedImages={uploadedImages}
      onUploadedImagesChange={onUploadedImagesChange}
      onTitleChange={onTitleChange}
      onDescriptionChange={onDescriptionChange}
      onPriceChange={onPriceChange}
      onCategoryChange={onCategoryChange}
      onLocationChange={onLocationChange}
      onStatusChange={onStatusChange}
      onListingTypeChange={onListingTypeChange}
      onConditionChange={onConditionChange}
      onDeliveryOptionChange={onDeliveryOptionChange}
      availableColors={availableColors}
      onAvailableColorsChange={onAvailableColorsChange}
    />
  )
}

function StoreViewRoute({ stores, businessProfile, allBusinesses, listings, navigate, handleStartChat, openListing, toggleSave, savedIds, loading, followingIds, notifyStoreIds, toggleFollowStore, toggleNotifyStore, session, storeReviews, addStoreReview, replyToStoreReview }: any) {
  const { userId } = useParams()
  
  const regStore: BusinessProfile | null = 
    (businessProfile?.userId === userId ? businessProfile : null) ||
    allBusinesses[userId || ''] ||
    Object.values(allBusinesses).find((b: any) => b.userId === userId) ||
    null

  if (!regStore) {
    const sellerExists = stores.some((s: Profile) => s.user_id === userId)
    if (sellerExists) {
      return <Navigate to={`/seller/${userId}`} replace />
    }
    if (loading) return <p style={{ padding: '24px' }}>Loading store...</p>
    return <p style={{ padding: '24px' }}>Store not found.</p>
  }

  return (
    <StoreViewPage
      shop={regStore}
      listings={listings}
      onBack={() => navigate('/stores')}
      onMessageSeller={() => {
        const shopListing = listings.find((l: Listing) => l.user_id === regStore.userId)
        if (shopListing) {
          void handleStartChat(shopListing)
        } else {
          void handleStartChat({
            id: -1,
            title: `Shop inquiry: ${regStore.shopName}`,
            description: `Direct message to ${regStore.shopName}`,
            price: 0,
            category: regStore.category,
            location: regStore.address,
            user_id: regStore.userId,
          })
        }
      }}
      onOpenListing={openListing}
      onToggleSave={toggleSave}
      savedIds={savedIds}
      currentUserId={session?.user?.id}
      followingIds={followingIds}
      notifyStoreIds={notifyStoreIds}
      onToggleFollowStore={toggleFollowStore}
      onToggleNotifyStore={toggleNotifyStore}
      storeReviews={storeReviews}
      onAddReview={addStoreReview}
      onReplyToReview={replyToStoreReview}
    />
  )
}

function SellerProfileRoute({ stores, listings, allBusinesses, navigate, openListing, toggleSave, savedIds }: any) {
  const { userId } = useParams()
  // Find the seller user profile in Supabase profiles (stores list)
  const seller = stores.find((s: Profile) => s.user_id === userId)
  // Check if they have a business store setup
  const bizProfile = allBusinesses[userId || ''] || null

  if (!seller) {
    if (bizProfile) {
      const mockSeller: Profile = {
        user_id: bizProfile.userId,
        username: bizProfile.shopName.replace(/\s+/g, '_').toLowerCase(),
        email: 'business@marketspace.zm',
        avatar_url: bizProfile.logo,
      }
      return (
        <SellerProfilePage
          seller={mockSeller}
          listings={listings}
          businessProfile={bizProfile}
          onBack={() => navigate(-1)}
          onOpenListing={openListing}
          onToggleSave={toggleSave}
          savedIds={savedIds}
        />
      )
    }
    return <p style={{ padding: '24px' }}>Seller profile not found.</p>
  }

  return (
    <SellerProfilePage
      seller={seller}
      listings={listings}
      businessProfile={bizProfile}
      onBack={() => navigate(-1)}
      onOpenListing={openListing}
      onToggleSave={toggleSave}
      savedIds={savedIds}
    />
  )
}
