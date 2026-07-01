
import { lazy } from 'react';
import { ViewState } from '../types';

export const ROUTE_MAP: Partial<Record<ViewState, any>> = {
  home: lazy(() => import('../features/discovery/Home')),
  discover: lazy(() => import('../features/discovery/Discover')),
  explore: lazy(() => import('../features/discovery/Explore')),
  detail: lazy(() => import('../features/discovery/BusinessDetail')),
  'merchant-portal': lazy(() => import('../features/merchant/MerchantPortal')),
  register: lazy(() => import('../features/merchant/Register')),
  pricing: lazy(() => import('../features/merchant/Pricing')),
  'ad-checkout': lazy(() => import('../features/discovery/AdCheckout')),
  'business-verification': lazy(() => import('../features/merchant/BusinessVerification')),
  oracle: lazy(() => import('../features/oracle/Oracle')),
  about: lazy(() => import('../features/info/About')),
  legal: lazy(() => import('../features/info/Legal')),
  support: lazy(() => import('../features/support/SupportCenter')),
  cargo: lazy(() => import('../features/logistics/Logistics')),
  profile: lazy(() => import('../features/auth/Profile')),
  messages: lazy(() => import('../features/oracle/ChatView')),
  admin: lazy(() => import('../features/admin/Admin')),
  'buyer-portal': lazy(() => import('../features/finance/BuyerPortal')),
  'ad-manager': lazy(() => import('../features/merchant/AdManager')),
  login: lazy(() => import('../features/auth/Login')),
  signup: lazy(() => import('../features/auth/Login')),
  onboarding: lazy(() => import('../onboarding/components/OnboardingRouter').then(m => ({ default: m.OnboardingRouter }))),
  'splash': lazy(() => import('../components/SplashScreen').then(m => ({ default: m.SplashScreen })))
};
