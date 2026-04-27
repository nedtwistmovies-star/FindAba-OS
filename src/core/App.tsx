import React, { Suspense } from "react";
import { notify } from "../lib/toast";
import ToastContainer from "../components/ToastContainer";

// your existing imports (keep all yours)
import { ErrorBoundary } from "./ErrorBoundary";
import { AppProviders } from "./AppProviders";
import Layout from "../components/Layout";
import LoadingScreen from "../components/LoadingScreen";
import RouteComponent from "../routes/RouteComponent";
import FeedbackToast from "../components/FeedbackToast";
import { ROUTE_MAP } from "../routes/routeMap";

// 👇 THIS IS YOUR MAIN APP LOGIC (formerly “AppContent”)
const AppContent: React.FC<any> = ({
  view,
  setView,
  appLogo,
  oracleAvatar,
  socialLinks,
  loading,
  businesses,
  heroImages,
  heroVideos,
  selectedBusiness,
  selectedStory,
  selectedAdvertorial,
  myBusiness,
  favorites,
  toggleFavorite,
  handleBusinessClick,
  handleStoryClick,
  refreshData,
  handleAuthSuccess,
  handleBack,
  userIdentifier,
  userRole,
  businessLoading,
  isOracleOpen,
  setIsOracleOpen,
  toasts,
  removeToast
}) => {

  const isAdmin =
    userRole === "admin" ||
    userIdentifier === "pastornelsonezi@gmail.com";

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
      <Suspense
        fallback={
          <LoadingScreen
            fullScreen={false}
            message="Synchronizing View..."
          />
        }
      >
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

          // 🔔 FAVORITES
          onToggleFavorite={(id) => {
            toggleFavorite(id);
            notify("Saved to favorites ⭐");
          }}

          // 🔔 BUSINESS CLICK
          onBusinessClick={(biz) => {
            handleBusinessClick(biz);
            notify("Opening business...");
          }}

          // 🔔 STORY CLICK
          onStoryClick={(story) => {
            handleStoryClick(story);
            notify("Viewing story...");
          }}

          // 🔔 REGISTER
          onRegister={() => {
            refreshData();
            notify("Registration successful ✅");
          }}

          // 🔔 REFRESH
          onRefresh={() => {
            refreshData();
            notify("Data refreshed 🔄");
          }}

          // 🔔 AUTH
          onAuthSuccess={(data) => {
            handleAuthSuccess(data);
            notify("Welcome back 👋");
          }}

          userEmail={userIdentifier}
          userRole={userRole}
          isRegistryLoading={businessLoading}
        />
      </Suspense>

      <FeedbackToast toasts={toasts} onRemove={removeToast} />

      {isOracleOpen && (
        <div className="fixed inset-0 z-[9999] animate-fade-in">
          <Suspense
            fallback={
              <LoadingScreen message="Consulting the Oracle..." />
            }
          >
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

// 👇 ROOT APP
const App: React.FC = (props: any) => {
  return (
    <ErrorBoundary>
      <AppProviders>

        {/* 🔔 GLOBAL TOAST SYSTEM */}
        <ToastContainer />

        {/* 🚀 FULL APP */}
        <AppContent {...props} />

      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
