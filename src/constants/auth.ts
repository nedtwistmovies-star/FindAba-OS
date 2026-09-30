
import { ViewState } from '../types';

/**
 * PUBLIC VIEWS
 * Completely accessible by any visitor without authentication.
 */
export const PUBLIC_VIEWS: ViewState[] = [
  'splash', 
  'onboarding', 
  'login', 
  'signup', 
  'legal', 
  'support', 
  'about', 
  'about-aba',
  'about-who',
  'about-vision',
  'about-mission',
  'contact',
  'home', 
  'explore', 
  'discover', 
  'detail',
  'feed',
  'editorial',
  'editorial-detail',
  'pricing',
  'register',
  'oracle',
  'messages',
  'cargo',
  'carry-me',
  'driver-registry',
  'sandals-hotels',
  'hotel-detail',
  'purple-fleet',
  'audio-heritage',
  'lab',
  'srts-dashboard'
];

/**
 * USER PROTECTED VIEWS
 * Accessible to any authenticated citizen/user.
 */
export const USER_PROTECTED_VIEWS: ViewState[] = [
  'profile',
  'buyer-portal',
  'wallet',
  'orders',
  'driver-console',
  'carry-go-dash',
  'ad-checkout'
];

/**
 * MERCHANT VIEWS
 * Accessible exclusively to registered/verified business owners and platform administrators.
 */
export const MERCHANT_VIEWS: ViewState[] = [
  'merchant-portal', 
  'business-verification', 
  'ad-manager',
  'dispute-center'
];

/**
 * ADMIN ONLY VIEWS
 * Strictly restricted to authorized platform administrators.
 * Must never be exposed to public users or standard merchants.
 */
export const ADMIN_VIEWS: ViewState[] = [
  'admin',
  'srts-office',
  'tech-setup',
  'hardware-audit',
  'booking-ledger',
  'hotel-partner-control',
  'fleet-admin',
  'registry-setup'
];

/**
 * Combined list of all views requiring authenticated access.
 */
export const PROTECTED_VIEWS: ViewState[] = [
  ...USER_PROTECTED_VIEWS,
  ...MERCHANT_VIEWS,
  ...ADMIN_VIEWS
];

