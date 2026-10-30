import { type ComponentProps, type FormEvent, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import { Shell } from './components/Shell'
import { useMarketplaceApp } from './features/marketplace/useMarketplaceApp'
import { isListingExpired } from './features/marketplace/listingExpiry'
import { ListingDetailPage, ListingFormPage } from './pages/ListingPage'
import { SavedItemsPage } from './pages/SavedNotificationsPage'
import { MessagesPage } from './pages/MessagesPage'
import { AuthPage } from './pages/AuthenticationPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { StoreViewPage } from './pages/StoreViewPage'
import { StoresPage } from './pages/StoresPage'
import { SearchPage } from './pages/SearchPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { BrowsePage } from './pages/BrowsePage'
import { useCart } from './features/marketplace/useCart'
import { ProfilePage } from './pages/ProfilePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminStoreReviewPage } from './pages/AdminStoreReviewPage'
import type { Listing, Profile, BusinessProfile } from './types'
import { isBestSeller, isNewArrival } from './utils/listingSections'
import { supabase } from './lib/supabaseClient'

function SlowlyFlashingMarketSpaceTemplate({ message = 'Loading MarketSpace...' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        padding: '32px 24px',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <style>{`
        @keyframes slowTemplateFlash {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.95;
          }
        }
        .slow-flashing-template {
          animation: slowTemplateFlash 2.4s ease-in-out infinite;
        }
      `}</style>

      <div
        className="slow-flashing-template"
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Top Navbar Skeleton Wireframe */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: '#18181b',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#3f3f46' }} />
            <div style={{ width: '120px', height: '14px', borderRadius: '6px', backgroundColor: '#27272a' }} />
          </div>
          <div style={{ width: '280px', height: '30px', borderRadius: '8px', backgroundColor: '#27272a' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#27272a' }} />
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#27272a' }} />
          </div>
        </div>

        {/* Hero Wireframe Banner */}
        <div
          style={{
            height: '180px',
            backgroundColor: '#18181b',
            borderRadius: '16px',
            border: '1px solid #27272a',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '180px', height: '20px', borderRadius: '6px', backgroundColor: '#3f3f46' }} />
          <div style={{ width: '280px', height: '12px', borderRadius: '4px', backgroundColor: '#27272a' }} />
          <div style={{ width: '100px', height: '32px', borderRadius: '999px', backgroundColor: '#52525b', marginTop: '10px' }} />
        </div>

        {/* 4 Cards Grid Skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1.05',
                  backgroundColor: '#18181b',
                  borderRadius: '12px',
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '54px', height: '54px', borderRadius: '8px', backgroundColor: '#27272a' }} />
              </div>
              <div style={{ width: '45%', height: '10px', borderRadius: '4px', backgroundColor: '#27272a', margin: '0 auto' }} />
              <div style={{ width: '80%', height: '13px', borderRadius: '4px', backgroundColor: '#3f3f46', margin: '0 auto' }} />
              <div style={{ width: '40%', height: '11px', borderRadius: '4px', backgroundColor: '#27272a', margin: '0 auto' }} />
            </div>
          ))}
        </div>

        {/* Subdued Status Text */}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.04em' }}>
            {message}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const app = useMarketplaceApp()
  useEffect(() => {
    window.scrollTo(0, 0)
    const searchParams = new URLSearchParams(location.search)
    const query = searchParams.get('search') || searchParams.get('q') || ''
    if (query !== app.searchQuery) {
      app.setSearchQuery(query)
    }
    if (location.pathname === '/search' && query) {
      app.addSearchHistory(query)
    }
  }, [location.pathname, location.search])

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
    status,
    listingType,
    condition,
    deliveryOption,
    setAuthEmail,
    setAuthPassword,
    setAuthUsername,
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

  const cart = useCart()

  if (loading) {
    return <SlowlyFlashingMarketSpaceTemplate message="Loading MarketSpace..." />
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>, captchaToken?: string) => {
    event.preventDefault()
    if (location.pathname === '/login' || location.pathname === '/auth') {
      await handleLogin()
      return
    }

    await handleSignup(captchaToken)
  }



  const isStorePage = location.pathname.startsWith('/store/')
  const storeUserIdParam = isStorePage ? location.pathname.split('/store/')[1]?.split('?')[0] : null
  const currentViewStore = storeUserIdParam
    ? (allBusinesses[storeUserIdParam] || (businessProfile?.userId === storeUserIdParam ? businessProfile : null))
    : null

  const storeContext = currentViewStore ? {
    userId: currentViewStore.userId,
    shopName: currentViewStore.shopName,
    collections: currentViewStore.collections || []
  } : null
  const configuredStoreDomain = (import.meta.env.VITE_STORE_DOMAIN || '').toLowerCase()
  const hostname = window.location.hostname.toLowerCase()
  const tenantSlug = configuredStoreDomain && hostname.endsWith(`.${configuredStoreDomain}`)
    ? hostname.slice(0, -(configuredStoreDomain.length + 1))
    : ''
  const tenantStore = tenantSlug ? Object.values(allBusinesses).find((store) => store.subdomain === tenantSlug) : undefined

  if (isStorePage) {
    return (
      <div className="standalone-store-site" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {message ? <div className="status-banner">{message}</div> : null}
        <Routes>
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
                onLogout={handleLogout}
                storeReviews={app.storeReviews}
                addStoreReview={app.addStoreReview}
                replyToStoreReview={app.replyToStoreReview}
                handleUpdateListingCollection={app.handleUpdateListingCollection}
                globalRenewalFrequency={app.globalRenewalFrequency}
                globalRenewalDay={app.globalRenewalDay}
                onEditListing={openEditListing}
                onRenewListing={handleRenewListing}
              />
            }
          />
        </Routes>
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
      </div>
    )
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
        savedCount={savedIds.length}
        unreadChatCount={app.chatThreads.filter((t) => t.unread).length}
        allBusinesses={allBusinesses}
        searchQuery={app.searchQuery}
        onSearchQueryChange={app.setSearchQuery}
        hasNewArrivals={listings.some((listing) => isNewArrival(listing))}
        hasBestSellers={listings.some((listing) => isBestSeller(listing))}
        storeContext={storeContext}
        cartItems={cart.cartItems}
        isCartOpen={cart.isCartOpen}
        onToggleCart={() => cart.setIsCartOpen(!cart.isCartOpen)}
        onUpdateCartQty={cart.updateQuantity}
        onRemoveCartItem={cart.removeFromCart}
        onClearCart={cart.clearCart}
        onLogout={handleLogout}
      >
        {message ? <div className="status-banner">{message}</div> : null}
        <Routes>
          <Route
            path="/"
            element={
              tenantStore
                ? <Navigate to={`/store/${tenantStore.userId}`} replace />
                : <DiscoveryPage
                    allBusinesses={allBusinesses}
                    listings={listings}
                    storeReviews={app.storeReviews}
                    addStoreReview={app.addStoreReview}
                    isSignedIn={Boolean(session)}
                  />
            }
          />
          <Route
            path="/discovery"
            element={
              <DiscoveryPage
                allBusinesses={allBusinesses}
                listings={listings}
                storeReviews={app.storeReviews}
                addStoreReview={app.addStoreReview}
                isSignedIn={Boolean(session)}
              />
            }
          />
          <Route
            path="/browse"
            element={
              <BrowsePage
                listings={listings}
                searchQuery={app.searchQuery}
                onSearchQueryChange={app.setSearchQuery}
                allBusinesses={allBusinesses}
                savedIds={savedIds}
                onToggleSave={(id) => toggleSave(Number(id))}
                onAddToCart={(it) => cart.addToCart(it)}
                onOpenListing={openListing}
                session={session}
              />
            }
          />
          <Route path="/shop" element={<Navigate to="/browse" replace />} />
          <Route
            path="/search"
            element={
              <SearchPage
                listings={listings}
                allBusinesses={allBusinesses}
                searchHistory={app.searchHistory}
                clearSearchHistory={app.clearSearchHistory}
                savedIds={savedIds}
                onToggleSave={(id) => toggleSave(id)}
                onVisitStore={(userId) => window.open(`/store/${userId}`, '_blank')}
                onAddToCart={(listing) => cart.addToCart(listing)}
                onSearch={(query) => {
                  app.setSearchQuery(query)
                  if (query) app.addSearchHistory(query)
                }}
                onOpenListing={openListing}
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
                handleRenewListing={handleRenewListing}
                handleDeleteListing={handleDeleteListing}
                globalRenewalFrequency={app.globalRenewalFrequency}
                globalRenewalDay={app.globalRenewalDay}
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
                onStatusChange={setStatus}
                onListingTypeChange={setListingType}
                onConditionChange={setCondition}
                onDeliveryOptionChange={setDeliveryOption}
                availableColors={availableColors}
                onAvailableColorsChange={setAvailableColors}
                renewalFrequency={app.renewalFrequency}
                onRenewalFrequencyChange={app.setRenewalFrequency}
                businessProfile={businessProfile}
                globalRenewalFrequency={app.globalRenewalFrequency}
                publishAs={app.publishAs}
                onPublishAsChange={app.setPublishAs}
                collectionId={app.collectionId}
                onCollectionIdChange={app.setCollectionId}
                howItWorks={app.howItWorks}
                onHowItWorksChange={app.setHowItWorks}
                useGlobalRenewal={app.useGlobalRenewal}
                onUseGlobalRenewalChange={app.setUseGlobalRenewal}
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
                allBusinesses={allBusinesses}
                onVisitShop={(shop) => {
                  setSelectedStore(shop)
                  window.open(`/store/${shop.userId}`, '_blank')
                }}
                listingKindFilter={listingKindFilter}
                listings={listings}
                searchQuery={app.searchQuery}
                onSearchQueryChange={app.setSearchQuery}
              />
            }
          />
          <Route
            path="/discovery"
            element={<DiscoveryPage allBusinesses={allBusinesses} listings={listings} storeReviews={app.storeReviews} addStoreReview={app.addStoreReview} isSignedIn={Boolean(session)} />}
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
                handleUpdateListingCollection={app.handleUpdateListingCollection}
                onSaveStoreTheme={app.handleSaveStoreTheme}
                globalRenewalFrequency={app.globalRenewalFrequency}
                globalRenewalDay={app.globalRenewalDay}
                onEditListing={openEditListing}
                onRenewListing={handleRenewListing}
              />
            }
          />
          <Route
            path="/seller/:userId"
            element={
              <SellerProfileRoute
                profile={profile}
                sessionUserId={session?.user.id}
                userEmail={userEmail}
                listings={listings}
                allBusinesses={allBusinesses}
                followingIds={followingIds}
                savedIds={savedIds}
                onToggleFollow={toggleFollowStore}
                onToggleSave={toggleSave}
                onOpenListing={openListing}
                onUploadAvatar={handleUploadAvatar}
                onUpdateUsername={async (username: string) => {
                  if (!session) throw new Error('Sign in to edit your profile.')
                  const { error: updateError } = await supabase.from('profiles').update({ username }).eq('user_id', session.user.id)
                  if (updateError) throw new Error(updateError.message)
                  app.setProfile((current) => current ? { ...current, username } : current)
                }}
              />
            }
          />
          <Route
            path="/profile/my-profile"
            element={session ? (
              <UserProfilePage
                profileUserId={session.user.id}
                profile={profile}
                sessionUserId={session.user.id}
                userEmail={userEmail}
                listings={myListings}
                businessProfile={businessProfile}
                followingIds={followingIds}
                savedIds={savedIds}
                onToggleFollow={toggleFollowStore}
                onToggleSave={toggleSave}
                onOpenListing={openListing}
                onUploadAvatar={handleUploadAvatar}
                onUpdateUsername={async (username) => {
                  const { error: updateError } = await supabase.from('profiles').update({ username }).eq('user_id', session.user.id)
                  if (updateError) throw new Error(updateError.message)
                  app.setProfile((current) => current ? { ...current, username } : current)
                }}
              />
            ) : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile/:tab?"
            element={
              <ProfileTabRoute
                session={session}
                profile={profile}
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
                onOpenListing={openListing}
                onToggleSave={toggleSave}
                onUpdateListingCollection={app.handleUpdateListingCollection}
                globalRenewalFrequency={app.globalRenewalFrequency}
                globalRenewalDay={app.globalRenewalDay}
                onSaveStoreTemplate={(content: Record<string, unknown>, departments?: Array<{ name: string; image?: string }>, templateId: 'boutique-grid' | 'storefront-landing' = 'boutique-grid') => app.handleSaveStoreTemplate(templateId, content, departments)}
                theme={theme}
                locationString="Lusaka"
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
                  onStatusChange: setStatus,
                  onListingTypeChange: setListingType,
                  onConditionChange: setCondition,
                  onDeliveryOptionChange: setDeliveryOption,
                  availableColors,
                  onAvailableColorsChange: setAvailableColors,
                  renewalFrequency: app.renewalFrequency,
                  onRenewalFrequencyChange: app.setRenewalFrequency,
                  businessProfile,
                  globalRenewalFrequency: app.globalRenewalFrequency,
                  globalRenewalDay: app.globalRenewalDay,
                  publishAs: app.publishAs,
                  onPublishAsChange: app.setPublishAs,
                  collectionId: app.collectionId,
                  onCollectionIdChange: app.setCollectionId,
                  howItWorks: app.howItWorks,
                  onHowItWorksChange: app.setHowItWorks,
                  useGlobalRenewal: app.useGlobalRenewal,
                  onUseGlobalRenewalChange: app.setUseGlobalRenewal,
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
              session ? (
                <SettingsPage
                  theme={theme}
                  location="Lusaka"
                  onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  onGoHome={() => navigate('/')}
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
                  userEmail={userEmail}
                  onDeleteAccount={app.handleDeleteAccount}
                  globalRenewalFrequency={app.globalRenewalFrequency}
                  setGlobalRenewalFrequency={app.setGlobalRenewalFrequency}
                  globalRenewalDay={app.globalRenewalDay}
                  setGlobalRenewalDay={app.setGlobalRenewalDay}
                  enableGlobalRenewal={app.enableGlobalRenewal}
                  setEnableGlobalRenewal={app.setEnableGlobalRenewal}
                />
              ) : (
                <Navigate to="/login" replace />
              )
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
          <Route
            path="/onboarding"
            element={
              session ? (
                <OnboardingPage
                  session={session}
                  profile={profile}
                  setProfile={app.setProfile}
                  setMessage={app.setMessage}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/store-review"
            element={session ? <AdminStoreReviewPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
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
          : tab === 'create-ad'
            ? 'create-ad'
            : tab === 'business-setup'
              ? 'business-setup'
              : tab === 'store-dashboard'
                ? 'store-dashboard'
                : tab === 'store-insights'
                  ? 'store-insights'
                  : tab === 'saved-listings'
                    ? 'saved-listings'
                    : 'dashboard'

  return session ? (
    <ProfilePage activeSection={activeSection} {...props} />
  ) : (
    <Navigate to="/login" replace />
  )
}

function ListingDetailRoute({ listings, loading, session, navigate, handleStartChat, toggleSave, openEditListing, allBusinesses, handleRenewListing, handleDeleteListing, globalRenewalFrequency = 'weekly', globalRenewalDay = 'Monday' }: { listings: Listing[]; loading: boolean; session: any; navigate: any; handleStartChat: any; toggleSave: any; openEditListing: any; allBusinesses: any; handleRenewListing: any; handleDeleteListing: any; globalRenewalFrequency?: any; globalRenewalDay?: string }) {
  const { id } = useParams()
  const listing = listings.find((l: Listing) => String(l.id) === id)
  if (listing && listing.user_id !== session?.user?.id && (isListingExpired(listing, globalRenewalFrequency, globalRenewalDay) || (listing.status && !['active', 'available'].includes(listing.status.toLowerCase())))) {
    return <Navigate to="/browse" replace />
  }
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
      onVisitStore={(userId) => window.open(`/store/${userId}`, '_blank')}
      onRenewListing={handleRenewListing}
      onDeleteListing={handleDeleteListing}
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
  onStatusChange,
  onListingTypeChange,
  onConditionChange,
  onDeliveryOptionChange,
  availableColors,
  onAvailableColorsChange,
  renewalFrequency,
  onRenewalFrequencyChange,
  businessProfile,
  globalRenewalFrequency,
  globalRenewalDay,
  publishAs,
  onPublishAsChange,
  collectionId,
  onCollectionIdChange,
  howItWorks,
  onHowItWorksChange,
  useGlobalRenewal,
  onUseGlobalRenewalChange,
}: {
  listings: Listing[]
  loading: boolean
  navigate: any
  handleUpdateListing: any
  title: string
  description: string
  price: string
  category: string
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
  onStatusChange: (value: string) => void
  onListingTypeChange: (value: string) => void
  onConditionChange: (value: string) => void
  onDeliveryOptionChange: (value: string) => void
  availableColors: string[]
  onAvailableColorsChange: (colors: string[]) => void
  renewalFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  onRenewalFrequencyChange?: (val: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void
  businessProfile?: any
  globalRenewalFrequency?: any
  globalRenewalDay?: any
  publishAs?: any
  onPublishAsChange?: any
  collectionId?: any
  onCollectionIdChange?: any
  howItWorks?: any
  onHowItWorksChange?: any
  useGlobalRenewal?: any
  onUseGlobalRenewalChange?: any
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
      onStatusChange={onStatusChange}
      onListingTypeChange={onListingTypeChange}
      onConditionChange={onConditionChange}
      onDeliveryOptionChange={onDeliveryOptionChange}
      availableColors={availableColors}
      onAvailableColorsChange={onAvailableColorsChange}
      renewalFrequency={renewalFrequency}
      onRenewalFrequencyChange={onRenewalFrequencyChange}
      businessProfile={businessProfile}
      globalRenewalFrequency={globalRenewalFrequency}
      globalRenewalDay={globalRenewalDay}
      publishAs={publishAs}
      onPublishAsChange={onPublishAsChange}
      collectionId={collectionId}
      onCollectionIdChange={onCollectionIdChange}
      howItWorks={howItWorks}
      onHowItWorksChange={onHowItWorksChange}
      useGlobalRenewal={useGlobalRenewal}
      onUseGlobalRenewalChange={onUseGlobalRenewalChange}
    />
  )
}

function StoreViewRoute({ stores, businessProfile, allBusinesses, listings, navigate, handleStartChat, openListing, toggleSave, savedIds, loading, followingIds, notifyStoreIds, toggleFollowStore, toggleNotifyStore, session, storeReviews, addStoreReview, replyToStoreReview, handleUpdateListingCollection, onSaveStoreTheme, globalRenewalFrequency, globalRenewalDay, onEditListing, onRenewListing }: any) {
  const { userId } = useParams()

  const regStore: BusinessProfile | null =
    (businessProfile?.userId === userId ? businessProfile : null) ||
    allBusinesses[userId || ''] ||
    Object.values(allBusinesses).find((b: any) => b.userId === userId) ||
    null

  const seller = stores.find((s: Profile) => s.user_id === userId)

  if (!regStore && !seller) {
    if (loading) {
      return <SlowlyFlashingMarketSpaceTemplate message="Loading Storefront..." />
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text)', padding: '24px', textAlign: 'center' }}>
        <span className="material-icons" style={{ fontSize: '56px', color: 'var(--text-muted)' }}>storefront</span>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Store Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '420px' }}>
          The store you are looking for does not exist or may have been moved.
        </p>
        <a href="/" target="_blank" rel="noopener noreferrer" className="primary-btn" style={{ textDecoration: 'none', padding: '10px 22px', borderRadius: '10px' }}>
          Explore MarketSpace Marketplace
        </a>
      </div>
    )
  }

  const effectiveStore: BusinessProfile = regStore || {
    userId: seller!.user_id,
    shopName: seller!.username ? `${seller!.username}'s Store` : 'Official Merchant Store',
    description: `Welcome to the official storefront of ${seller!.username || 'our store'}. Browse our active inventory below.`,
    category: 'General Merchant',
    address: 'Lusaka, Zambia',
    whatsapp: '',
    logo: seller!.avatar_url || '',
    cover: '/banners/store_banner_apparel.png',
    accentColor: '#2563eb',
    announcementBar: '',
    collections: [],
    customerCare: {},
    catalog: [],
    ads: [],
    themeConfig: undefined
  }

  let savedLocalTheme: any = undefined
  try {
    const localStr = window.localStorage.getItem(`marketspace-store-theme-${effectiveStore.userId}`)
    if (localStr) savedLocalTheme = JSON.parse(localStr)
  } catch { }

  const storeWithTheme: BusinessProfile = {
    ...effectiveStore,
    themeConfig: effectiveStore.themeConfig || savedLocalTheme || undefined
  }

  return (
    <StoreViewPage
      shop={storeWithTheme}
      listings={listings}
      onBack={() => navigate('/stores')}
      onMessageSeller={(customMessage?: string) => {
        if (session?.user?.id === effectiveStore.userId) {
          return
        }
        const listingId = new URLSearchParams(window.location.search).get('listing')
        const shopListing = (listingId ? listings.find((l: Listing) => String(l.id) === listingId && l.user_id === effectiveStore.userId) : undefined)
          || listings.find((l: Listing) => l.user_id === effectiveStore.userId)
        if (shopListing) {
          void handleStartChat(shopListing, customMessage, true)
        } else {
          void handleStartChat({
            id: 0,
            title: `Shop inquiry: ${effectiveStore.shopName}`,
            description: `Direct message to ${effectiveStore.shopName}`,
            price: 0,
            category: effectiveStore.category,
            user_id: effectiveStore.userId,
          }, customMessage, true)
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
      onUpdateListingCollection={handleUpdateListingCollection}
      onSaveStoreTheme={(config) => onSaveStoreTheme?.(config, effectiveStore.userId)}
      globalRenewalFrequency={globalRenewalFrequency}
      globalRenewalDay={globalRenewalDay}
      onEditListing={onEditListing}
      onRenewListing={onRenewListing}
    />
  )
}

function SellerProfileRoute({ allBusinesses, ...props }: Omit<ComponentProps<typeof UserProfilePage>, 'profileUserId' | 'businessProfile'> & {
  allBusinesses?: Record<string, BusinessProfile>
}) {
  const { userId } = useParams()
  const businessProfile = allBusinesses?.[userId || ''] || null
  return <UserProfilePage {...props} profileUserId={userId} businessProfile={businessProfile} />
}
