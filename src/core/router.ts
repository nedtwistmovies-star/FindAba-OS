
import { lazy } from 'react';
import { ViewState } from '../types';

/**
 * Enhanced lazy loader with retry support
 * Prevents dynamic chunk loading crashes after deployments
 */
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {

    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem(
        'page-has-been-force-refreshed'
      ) || 'false'
    );

    try {

      const component = await componentImport();

      window.sessionStorage.setItem(
        'page-has-been-force-refreshed',
        'false'
      );

      return component;

    } catch (error) {

      if (!pageHasBeenForceRefreshed) {

        console.warn(
          'Industrial Module Fault detected. Attempting synchronization...'
        );

        window.sessionStorage.setItem(
          'page-has-been-force-refreshed',
          'true'
        );

        window.location.reload();

        return {
          default: () => null
        };
      }

      throw error;
    }
  });
};

export const ROUTE_MAP: Record<ViewState, any> = {

  /**
   * CORE
   */
  home: lazyWithRetry(() =>
    import('../features/discovery/Home')
  ),

  discover: lazyWithRetry(() =>
    import('../features/discovery/Discover')
  ),

  explore: lazyWithRetry(() =>
    import('../features/discovery/Explore')
  ),

  detail: lazyWithRetry(() =>
    import('../features/discovery/BusinessDetail')
  ),

  editorial: lazyWithRetry(() =>
    import('../features/discovery/AdvertorialFeed')
  ),

  'editorial-detail': lazyWithRetry(() =>
    import('../features/discovery/AdvertorialDetail')
  ),

  feed: lazyWithRetry(() =>
    import('../features/faces/FacesFeed')
  ),

  /**
   * AUTH
   */
  login: lazyWithRetry(() =>
    import('../features/auth/Login')
  ),

  signup: lazyWithRetry(() =>
    import('../features/auth/Login')
  ),

  verifyotp: lazyWithRetry(() =>
    import('../features/auth/VerifyOTP')
  ),

  profile: lazyWithRetry(() =>
    import('../features/auth/Profile')
  ),

  /**
   * MERCHANT
   */
  'merchant-portal': lazyWithRetry(() =>
    import('../features/merchant/MerchantPortal')
  ),

  register: lazyWithRetry(() =>
    import('../features/merchant/Register')
  ),

  pricing: lazyWithRetry(() =>
    import('../features/merchant/Pricing')
  ),

  'business-verification': lazyWithRetry(() =>
    import('../features/merchant/BusinessVerification')
  ),

  'ad-manager': lazyWithRetry(() =>
    import('../features/merchant/AdManager')
  ),

  /**
   * ADS
   */
  'ad-checkout': lazyWithRetry(() =>
    import('../features/discovery/AdCheckout')
  ),

  /**
   * ORACLE
   */
  oracle: lazyWithRetry(() =>
    import('../features/oracle/Oracle')
  ),

  messages: lazyWithRetry(() =>
    import('../features/oracle/ChatView')
  ),

  /**
   * INFO
   */
  about: lazyWithRetry(() =>
    import('../features/info/About')
  ),

  'about-aba': lazyWithRetry(() =>
    import('../features/info/AboutAba')
  ),

  legal: lazyWithRetry(() =>
    import('../features/info/Legal')
  ),

  support: lazyWithRetry(() =>
    import('../features/support/SupportCenter')
  ),

  contact: lazyWithRetry(() =>
    import('../features/info/Contact')
  ),

  'about-who': lazyWithRetry(() =>
    import('../features/info/About')
  ),

  'about-vision': lazyWithRetry(() =>
    import('../features/info/About')
  ),

  'about-mission': lazyWithRetry(() =>
    import('../features/info/About')
  ),

  /**
   * FINANCE
   */
  wallet: lazyWithRetry(() =>
    import('../features/finance/WalletView')
  ),

  orders: lazyWithRetry(() =>
    import('../features/finance/BuyerOrdersView')
  ),

  'buyer-portal': lazyWithRetry(() =>
    import('../features/finance/BuyerPortal')
  ),

  'srts-dashboard': lazyWithRetry(() =>
    import('../features/finance/ThriftDashboard')
  ),

  /**
   * HOSPITALITY
   */
  'sandals-hotels': lazyWithRetry(() =>
    import('../features/hospitality/SandalsHotels')
  ),

  'hotel-detail': lazyWithRetry(() =>
    import('../features/hospitality/SandalsHotels')
  ),

  'booking-ledger': lazyWithRetry(() =>
    import('../features/hospitality/HotelLedger')
  ),

  'hotel-partner-control': lazyWithRetry(() =>
    import('../features/hospitality/HotelPartnerControl')
  ),

  /**
   * LOGISTICS
   */
  cargo: lazyWithRetry(() =>
    import('../features/logistics/Logistics')
  ),

  'carry-me': lazyWithRetry(() =>
    import('../features/logistics/CarryMe')
  ),

  'carry-go-dash': lazyWithRetry(() =>
    import('../features/logistics/CarryGoDash')
  ),

  'purple-fleet': lazyWithRetry(() =>
    import('../features/logistics/PurpleFleet')
  ),

  'driver-registry': lazyWithRetry(() =>
    import('../features/logistics/DriverRegistry')
  ),

  'driver-console': lazyWithRetry(() =>
    import('../features/logistics/DriverConsole')
  ),

  'fleet-admin': lazyWithRetry(() =>
    import('../features/logistics/FleetAdmin')
  ),

  /**
   * TECH
   */
  'registry-setup': lazyWithRetry(() =>
    import('../features/tech/RegistrySetup')
  ),

  'hardware-audit': lazyWithRetry(() =>
    import('../features/tech/HardwareAudit')
  ),

  /**
   * ADMIN
   */
  admin: lazyWithRetry(() =>
    import('../features/admin/Admin')
  ),

  'srts-office': lazyWithRetry(() =>
    import('../features/admin/SandalsOffice')
  ),

  /**
   * CREATIVE
   */
  lab: lazyWithRetry(() =>
    import('../features/creative/CreativeLab')
  ),

  'audio-heritage': lazyWithRetry(() =>
    import('../features/creative/AudioHeritage')
  ),

  /**
   * DISPUTE
   */
  'dispute-center': lazyWithRetry(() =>
    import('../features/merchant/MerchantPortal')
  ),

  /**
   * ONBOARDING
   */
  onboarding: lazyWithRetry(() =>
    import('../onboarding/components/OnboardingRouter')
      .then((m) => ({
        default: m.OnboardingRouter
      }))
  )
};

export default ROUTE_MAP;
