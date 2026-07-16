import type { FormEvent } from 'react'
import './App.css'
import { Shell } from './components/Shell'
import { useMarketplaceApp } from './features/marketplace/useMarketplaceApp'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage, ListingFormPage } from './pages/ListingPage'
import { SavedItemsPage, NotificationsPage } from './pages/SavedNotificationsPage'
import { MessagesPage, AuthPage } from './pages/MessagesAuthPage'
import { StoresPage, ProfilePage, SettingsPage } from './pages/StoresProfileSettingsPage'

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
    heroStats,
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
          savedListings={savedListings}
          heroStats={heroStats}
          openListing={openListing}
          toggleSave={toggleSave}
          setView={setView}
          distanceFilter={distanceFilter}
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
            setView('messages')
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
      return <StoresPage stores={stores} onOpenProfile={() => setView('profile')} />
    }

    if (view === 'profile') {
      return (
        <ProfilePage
          profile={profile}
          userEmail={userEmail}
          myListings={myListings}
          listings={listings}
          savedListings={savedListings}
          onOpenSettings={() => setView('settings')}
          onCreateListing={() => setView('create')}
          onEditListing={openEditListing}
          onLogout={handleLogout}
        />
      )
    }

    if (view === 'settings') {
      return (
        <SettingsPage
          theme={theme}
          location={location}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onGoHome={() => setView('home')}
        />
      )
    }

    if (view === 'messages') {
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
      session={session}
      searchQuery={searchQuery}
      activeCategories={activeCategories}
      priceRange={priceRange}
      distanceFilter={distanceFilter}
      sortBy={sortBy}
      showOnlyAvailable={showOnlyAvailable}
      onSearchChange={setSearchQuery}
      onSubmitSearch={() => setView('home')}
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
