import type { FormEvent } from 'react'
import './App.css'
import { Shell } from './components/Shell'
import { useMarketplaceApp } from './features/marketplace/useMarketplaceApp'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage, ListingFormPage } from './pages/ListingPage'
import { SavedItemsPage, NotificationsPage } from './pages/SavedNotificationsPage'
import { MessagesPage, AuthPage } from './pages/MessagesAuthPage'
import { StoresPage, ProfilePage, SettingsPage, BusinessSetupPage, BusinessHubPage, StoreViewPage } from './pages/StoresProfileSettingsPage'

export function AppContent() {
  const app = useMarketplaceApp()
  const {
    view,
    setView,
    session,
    theme,
    setTheme,
    profile,
    listings,
    stores,
    selectedListing,
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
    location,
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
    selectedStore,
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
  } = app

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (view === 'login') {
      await handleLogin()
      return
    }

    await handleSignup()
  }

  const renderContent = () => {
    if (view === 'home') {
      return (
        <HomePage
          loading={loading}
          filteredListings={app.filteredListings}
          savedIds={savedIds}
          openListing={openListing}
          toggleSave={toggleSave}
          setView={setView}
          distanceFilter={distanceFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cardSize={cardSize}
        />
      )
    }

    if (view === 'listing') {
      return (
        <ListingDetailPage
          selectedListing={selectedListing}
          session={session}
          onBack={() => setView('home')}
          onMessageSeller={() => {
            setView('inbox')
            setCanMessage(true)
          }}
          onToggleSave={toggleSave}
          onEditListing={openEditListing}
        />
      )
    }

    if (view === 'create') {
      return (
        <ListingFormPage
          mode="create"
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
          onUploadedImagesChange={setUploadedImages}
          onSubmit={handleCreateListing}
          onCancel={() => setView('home')}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onPriceChange={setPrice}
          onCategoryChange={setCategory}
          onLocationChange={setLocation}
          onStatusChange={setStatus}
          onListingTypeChange={setListingType}
          onConditionChange={setCondition}
          onDeliveryOptionChange={setDeliveryOption}
        />
      )
    }

    if (view === 'edit') {
      return (
        <ListingFormPage
          mode="edit"
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
          onUploadedImagesChange={setUploadedImages}
          onSubmit={handleUpdateListing}
          onCancel={() => setView('home')}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onPriceChange={setPrice}
          onCategoryChange={setCategory}
          onLocationChange={setLocation}
          onStatusChange={setStatus}
          onListingTypeChange={setListingType}
          onConditionChange={setCondition}
          onDeliveryOptionChange={setDeliveryOption}
        />
      )
    }

    if (view === 'saved') {
      return <SavedItemsPage savedListings={savedListings} onOpenListing={openListing} onToggleSave={toggleSave} />
    }

    if (view === 'notifications') {
      return <NotificationsPage notifications={notifications} onMarkAllRead={markAllRead} />
    }

    if (view === 'stores') {
      return (
        <StoresPage
          stores={stores}
          allBusinesses={allBusinesses}
          onVisitShop={(shop) => {
            setSelectedStore(shop)
            setView('store-view')
          }}
          onOpenProfile={() => setView('profile')}
        />
      )
    }

    if (view === 'profile') {
      return (
        <ProfilePage
          profile={profile}
          userEmail={userEmail}
          myListings={myListings}
          listings={listings}
          savedListings={savedListings}
          savedIds={savedIds}
          businessProfile={businessProfile}
          onOpenSettings={() => setView('settings')}
          onCreateListing={() => setView('create')}
          onEditListing={openEditListing}
          onRenewListing={handleRenewListing}
          onDeleteListing={handleDeleteListing}
          onUpdateStatus={handleUpdateListingStatus}
          onOpenBusinessSetup={() => setView('business-setup')}
          onOpenBusinessHub={() => setView('business-hub')}
          onUploadAvatar={handleUploadAvatar}
          onOpenListing={openListing}
          onToggleSave={toggleSave}
          onLogout={handleLogout}
        />
      )
    }

    if (view === 'business-setup') {
      return (
        <BusinessSetupPage
          userId={session?.user?.id || ''}
          businessProfile={businessProfile}
          onSave={handleCreateOrUpdateBusiness}
          onCancel={() => setView('profile')}
        />
      )
    }

    if (view === 'business-hub') {
      if (!businessProfile) {
        setView('profile')
        return null
      }
      return (
        <BusinessHubPage
          businessProfile={businessProfile}
          myListings={myListings}
          onSave={handleCreateOrUpdateBusiness}
          onBack={() => setView('profile')}
        />
      )
    }

    if (view === 'store-view') {
      if (!selectedStore) {
        setView('stores')
        return null
      }
      return (
        <StoreViewPage
          shop={selectedStore}
          listings={listings}
          onBack={() => setView('stores')}
          onMessageSeller={() => {
            setView('inbox')
            setCanMessage(true)
          }}
          onOpenListing={openListing}
          onToggleSave={toggleSave}
          savedIds={savedIds}
        />
      )
    }

    if (view === 'settings') {
      return (
        <SettingsPage
          theme={theme}
          location={location}
          cardSize={cardSize}
          onCardSizeChange={setCardSize}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onGoHome={() => setView('home')}
        />
      )
    }

    if (view === 'inbox') {
      return (
        <MessagesPage
          chatThreads={chatThreads}
          activeChatId={activeChatId}
          canMessage={canMessage}
          chatDraft={chatDraft}
          onSelectThread={setActiveChatId}
          onToggleMute={() => setCanMessage((value) => !value)}
          onDraftChange={setChatDraft}
          onSendMessage={sendInboxMessage}
        />
      )
    }

    if (view === 'account' || view === 'signup' || view === 'login') {
      return (
        <AuthPage
          mode={view === 'signup' ? 'signup' : 'login'}
          isSignedIn={Boolean(session)}
          userEmail={userEmail}
          authEmail={authEmail}
          authPassword={authPassword}
          authUsername={authUsername}
          onAuthEmailChange={setAuthEmail}
          onAuthPasswordChange={setAuthPassword}
          onAuthUsernameChange={setAuthUsername}
          onSubmit={handleAuthSubmit}
          onSwitchMode={() => setView(view === 'login' ? 'signup' : 'login')}
          onLogout={handleLogout}
          onGoProfile={() => setView('profile')}
        />
      )
    }

    return null
  }

  return (
    <Shell
      view={view}
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
      onNavigate={setView}
    >
      {message ? <div className="status-banner">{message}</div> : null}
      {renderContent()}
    </Shell>
  )
}
