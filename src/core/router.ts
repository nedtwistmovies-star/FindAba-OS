
import { lazy } from 'react';
import { ViewState } from '../types';

function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<any>
) {
  return lazy(async () => {
    try {
      let mod = await importFn();
      // Handle nested default exports if any
      if (mod && mod.default) {
        let comp = mod.default;
        if (comp && comp.default) {
          comp = comp.default;
        }
        return { default: comp };
      }
      return { default: mod };
    } catch (error) {
      console.warn('[Router] Dynamic import failed, reloading page once...', error);
      const reloaded = sessionStorage.getItem('findaba_chunk_reloaded');
      if (!reloaded) {
        sessionStorage.setItem('findaba_chunk_reloaded', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

export const ROUTE_MAP: Record<string, any> = {
  home: safeLazy(() => import('../features/discovery/Home')),
  discover: safeLazy(() => import('../features/discovery/Discover')),
  explore: safeLazy(() => import('../features/discovery/Explore')),
  detail: safeLazy(() => import('../features/discovery/BusinessDetail')),
  'merchant-portal': safeLazy(() => import('../features/merchant/MerchantPortal')),
  register: safeLazy(() => import('../features/merchant/Register')),
  pricing: safeLazy(() => import('../features/merchant/Pricing')),
  'ad-checkout': safeLazy(() => import('../features/discovery/AdCheckout')),
  'business-verification': safeLazy(() => import('../features/merchant/BusinessVerification')),
  oracle: safeLazy(() => import('../features/oracle/Oracle')),
  about: safeLazy(() => import('../features/info/About')),
  legal: safeLazy(() => import('../features/info/Legal')),
  support: safeLazy(() => import('../features/support/SupportCenter')),
  cargo: safeLazy(() => import('../features/logistics/Logistics')),
  profile: safeLazy(() => import('../features/auth/Profile')),
  messages: safeLazy(() => import('../features/oracle/ChatView')),
  admin: safeLazy(() => import('../features/admin/Admin')),
  'tech-setup': safeLazy(() => import('../features/tech/SetupConnection')),
  'buyer-portal': safeLazy(() => import('../features/finance/BuyerPortal')),
  'ad-manager': safeLazy(() => import('../features/merchant/AdManager')),
  login: safeLazy(() => import('../features/auth/Login')),
  signup: safeLazy(() => import('../features/auth/Login')),
  onboarding: safeLazy(() => import('../onboarding/components/OnboardingRouter').then(m => ({ default: m.OnboardingRouter }))),
  'splash': safeLazy(() => import('../components/SplashScreen').then(m => ({ default: m.SplashScreen }))),
  
  // Feature views mapped to resolve the home screen fallback redirects
  feed: safeLazy(() => import('../features/faces/FacesFeed')),
  faces: safeLazy(() => import('../features/faces/FacesFeed')),
  'purple-fleet': safeLazy(() => import('../features/logistics/PurpleFleet')),
  'sandals-hotels': safeLazy(() => import('../features/hospitality/SandalsHotels')),
  'srts-dashboard': safeLazy(() => import('../features/finance/ThriftDashboard')),
  'thrift-dashboard': safeLazy(() => import('../features/finance/ThriftDashboard')),
  lab: safeLazy(() => import('../features/creative/AudioHeritage')),
  'audio-heritage': safeLazy(() => import('../features/creative/AudioHeritage')),
  'about-aba': safeLazy(() => import('../features/info/AboutAba')),
  editorial: safeLazy(() => import('../features/discovery/AdvertorialFeed')),
  'aba-stories': safeLazy(() => import('../features/discovery/AdvertorialFeed')),
  reels: safeLazy(() => import('../features/discovery/AdvertorialFeed')),
  'hardware-audit': safeLazy(() => import('../features/tech/RegistrySetup')),
  'registry-setup': safeLazy(() => import('../features/tech/RegistrySetup'))
};
