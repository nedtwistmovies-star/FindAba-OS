
import { lazy } from 'react';
import { ViewState } from '../types';

/**
 * Enhanced lazy loader that automatically retries if a chunk fails to load.
 * This prevents the "Failed to fetch dynamically imported module" error 
 * when a new version of the app is deployed.
 */
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        // Logging the fault to the console
        console.warn('Industrial Module Fault detected. Attempting synchronization...');
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }

      // If we already refreshed and it still fails, let the error boundary handle it
      throw error;
    }
  });
};

export const ROUTE_MAP: Record<ViewState, any> = {
  home: lazyWithRetry(() => import('../features/discovery/Home')),
  discover: lazyWithRetry(() => import('../features/discovery/Discover')),
  explore: lazyWithRetry(() => import('../features/discovery/Explore')),
  detail: lazyWithRetry(() => import('../features/discovery/BusinessDetail')),
  editorial: lazyWithRetry(() => import('../features/discovery/AdvertorialFeed')),
  'editorial-detail': lazyWithRetry(() => import('../features/discovery/AdvertorialDetail')),
  feed: lazyWithRetry(() => import('../features/faces/FacesFeed')),
  'merchant-portal': lazyWithRetry(() => import('../features/merchant/MerchantPortal')),
  register: lazyWithRetry(() => import('../features/merchant/Register')),
  pricing: lazyWithRetry(() => import('../features/merchant/Pricing')),
  'ad-checkout': lazyWithRetry(() => import('../features/discovery/AdCheckout')),
  'business-verification': lazyWithRetry(() => import('../features/merchant/BusinessVerification')),
  oracle: lazyWithRetry(() => import('../features/oracle/Oracle')),
  about: lazyWithRetry(() => import('../features/info/About')),
  'about-aba': lazyWithRetry(() => import('../features/info/AboutAba')),
  legal: lazyWithRetry(() => import('../features/info/Legal')),
  support: lazyWithRetry(() => import('../features/support/SupportCenter')),
  orders: lazyWithRetry(() => import('../features/finance/BuyerOrdersView')),
  'dispute-center': lazyWithRetry(() => import('../features/merchant/MerchantPortal')),
  
  // Fillers for other types to avoid exhaustive errors if needed
  lab: lazyWithRetry(() => import('../features/creative/CreativeLab')),
  cargo: lazyWithRetry(() => import('../features/logistics/Logistics')),
  profile: lazyWithRetry(() => import('../features/auth/Profile')),
  messages: lazyWithRetry(() => import('../features/oracle/ChatView')),
  admin: lazyWithRetry(() => import('../features/admin/Admin')),
  'srts-dashboard': lazyWithRetry(() => import('../features/finance/ThriftDashboard')),
  'buyer-portal': lazyWithRetry(() => import('../features/finance/BuyerPortal')),
  'ad-manager': lazyWithRetry(() => import('../features/merchant/AdManager')),
  'registry-setup': lazyWithRetry(() => import('../features/tech/RegistrySetup')),
  'sandals-hotels': lazyWithRetry(() => import('../features/hospitality/SandalsHotels')),
  wallet: lazyWithRetry(() => import('../features/finance/WalletView')),
  contact: lazyWithRetry(() => import('../features/info/Contact')),
  'audio-heritage': lazyWithRetry(() => import('../features/creative/AudioHeritage')),
  'srts-office': lazyWithRetry(() => import('../features/admin/SandalsOffice')),
  'booking-ledger': lazyWithRetry(() => import('../features/hospitality/HotelLedger')),
  'hotel-detail': lazyWithRetry(() => import('../features/hospitality/SandalsHotels')),
  'hotel-partner-control': lazyWithRetry(() => import('../features/hospitality/HotelPartnerControl')),
  'about-who': lazyWithRetry(() => import('../features/info/About')),
  'about-vision': lazyWithRetry(() => import('../features/info/About')),
  'about-mission': lazyWithRetry(() => import('../features/info/About')),
  login: lazyWithRetry(() => import('../features/auth/Login')),
  signup: lazyWithRetry(() => import('../features/auth/Login')),
  'carry-me': lazyWithRetry(() => import('../features/logistics/CarryMe')),
  'driver-registry': lazyWithRetry(() => import('../features/logistics/DriverRegistry')),
  'purple-fleet': lazyWithRetry(() => import('../features/logistics/PurpleFleet')),
  'driver-console': lazyWithRetry(() => import('../features/logistics/DriverConsole')),
  'fleet-admin': lazyWithRetry(() => import('../features/logistics/FleetAdmin')),
  'hardware-audit': lazyWithRetry(() => import('../features/tech/HardwareAudit')),
  'carry-go-dash': lazyWithRetry(() => import('../features/logistics/CarryGoDash')),
  onboarding: lazyWithRetry(() => import('../onboarding/components/OnboardingRouter').then(m => ({ default: m.OnboardingRouter }))),
  'terminal': lazyWithRetry(() => import('../features/merchant/TerminalTab')),
  'terminal-pay': lazyWithRetry(() => import('../features/merchant/TerminalPay'))
};
