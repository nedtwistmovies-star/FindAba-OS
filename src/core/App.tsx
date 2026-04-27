const isAdmin = userRole === 'admin' || userIdentifier === 'pastornelsonezi@gmail.com';

if (loading && businesses.length === 0) {
  return <LoadingScreen message="Initializing Industrial Matrix..." />;
}

return (
  <Layout 
    currentView={view} 
    setView={setView} 
    appLogo={appLogo} 
    oracleAvatar={oracleAvatar} 
    socialLinks={socialLinks}
  >
    {/* Non-blocking loading indicator removed for faster launch */}
    
    <Suspense fallback={<LoadingScreen fullScreen={false} message="Synchronizing View..." />}>
      <RouteComponent 
        setView={setView} 
        onBack={handleBack}
        businesses={businesses} 
        heroImages={heroImages} 
        heroVideos={heroVideos} 
        business={selectedBusiness}
        story={selectedStory}
        advertorial={selectedAdvertorial}
        myBusiness={myBusiness}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onBusinessClick={handleBusinessClick}
        onStoryClick={handleStoryClick}
        onRegister={refreshData}
        onRefresh={refreshData}
        onAuthSuccess={handleAuthSuccess}
        userEmail={userIdentifier}
        userRole={userRole}
        isRegistryLoading={businessLoading}
      />
    </Suspense>

    <FeedbackToast toasts={toasts} onRemove={removeToast} />

    {isOracleOpen && (
      <div className="fixed inset-0 z-[9999] animate-fade-in">
        {/* Lazy Loaded Oracle from ROUTE_MAP */}
        <Suspense fallback={<LoadingScreen message="Consulting the Oracle..." />}>
          <ROUTE_MAP.oracle
            onBack={() => setIsOracleOpen(false)}
            setView={setView}
            catalog={businesses}
            oracleAvatar={oracleAvatar}
          />
        </Suspense>
      </div>
    )}
  </Layout>
);
};




// ✅ ONLY CHANGE IS BELOW

import ToastContainer from "../components/ToastContainer";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>

        {/* 🔔 GLOBAL TOAST SYSTEM ADDED */}
        <ToastContainer />

        <AppContent />

      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
