
import React, { lazy } from 'react';
import { ViewState } from '../types';
import ProtectedRoute from '../components/ProtectedRoute';

// Feature-based Lazy Loading
export const Home = lazy(() => import('../features/discovery/Home'));
export const Discover = lazy(() => import('../features/discovery/Discover'));
export const Explore = lazy(() => import('../features/discovery/Explore'));
export const BusinessDetail = lazy(() => import('../features/discovery/BusinessDetail'));
export const Feed = lazy(() => import('../features/discovery/Feed'));
export const FacesFeed = lazy(() => import('../features/faces/FacesFeed'));
export const WalletView = lazy(() => import('../features/finance/WalletView'));
export const AdvertorialFeed = lazy(() => import('../features/discovery/AdvertorialFeed'));
export const AdvertorialDetail = lazy(() => import('../features/discovery/AdvertorialDetail'));
export const EditorialDetail = lazy(() => import('../features/discovery/EditorialDetail'));
export const AdCheckout = lazy(() => import('../features/discovery/AdCheckout'));

export const MerchantPortal = lazy(() => import('../features/merchant/MerchantPortal'));
export const Register = lazy(() => import('../features/merchant/Register'));
export const Pricing = lazy(() => import('../features/merchant/Pricing'));
export const BusinessVerification = lazy(() => import('../features/merchant/BusinessVerification'));
export const AdManager = lazy(() => import('../features/merchant/AdManager'));

export const CarryMe = lazy(() => import('../features/logistics/CarryMe'));
export const DriverConsole = lazy(() => import('../features/logistics/DriverConsole'));
export const PurpleFleet = lazy(() => import('../features/logistics/PurpleFleet'));
export const DriverRegistry = lazy(() => import('../features/logistics/DriverRegistry'));
export const Logistics = lazy(() => import('../features/logistics/Logistics'));
export const CarryGoDash = lazy(() => import('../features/logistics/CarryGoDash'));
export const FleetAdmin = lazy(() => import('../features/logistics/FleetAdmin'));

export const Admin = lazy(() => import('../features/admin/Admin'));
export const SandalsOffice = lazy(() => import('../features/admin/SandalsOffice'));

export const CreativeLab = lazy(() => import('../features/creative/CreativeLab'));
export const AudioHeritage = lazy(() => import('../features/creative/AudioHeritage'));

export const ThriftDashboard = lazy(() => import('../features/finance/ThriftDashboard'));

export const SandalsHotels = lazy(() => import('../features/hospitality/SandalsHotels'));
export const HotelLedger = lazy(() => import('../features/hospitality/HotelLedger'));
export const HotelPartnerControl = lazy(() => import('../features/hospitality/HotelPartnerControl'));

export const AboutAba = lazy(() => import('../features/info/AboutAba'));
export const About = lazy(() => import('../features/info/About'));
export const Contact = lazy(() => import('../features/info/Contact'));
export const Legal = lazy(() => import('../features/info/Legal'));

export const HardwareAudit = lazy(() => import('../features/tech/HardwareAudit'));
export const SetupConnection = lazy(() => import('../features/tech/SetupConnection'));

export const Oracle = lazy(() => import('../features/oracle/Oracle'));
export const ChatView = lazy(() => import('../features/oracle/ChatView'));

export const Login = lazy(() => import('../features/auth/Login'));
export const Signup = lazy(() => import('../pages/Signup'));
export const Profile = lazy(() => import('../features/auth/Profile'));
export const Onboarding = lazy(() => import('../features/auth/Onboarding'));
export const SupportCenter = lazy(() => import('../features/support/SupportCenter'));

export const BuyerOrdersView = lazy(() => import('../features/finance/BuyerOrdersView'));

// High-order Role Guard Wrappers
const withAdmin = (Component: React.ComponentType<any>) => (props: any) => (
  <ProtectedRoute allowedRoles={['admin']}>
    <Component {...props} />
  </ProtectedRoute>
);

const withMerchant = (Component: React.ComponentType<any>) => (props: any) => (
  <ProtectedRoute allowedRoles={['merchant', 'admin']}>
    <Component {...props} />
  </ProtectedRoute>
);

const withUser = (Component: React.ComponentType<any>) => (props: any) => (
  <ProtectedRoute allowedRoles={['user', 'merchant', 'admin']}>
    <Component {...props} />
  </ProtectedRoute>
);

export const ROUTE_MAP: Partial<Record<ViewState, any>> & Record<string, any> = {
  'home': Home,
  'discover': Discover,
  'explore': Explore,
  'detail': BusinessDetail,
  'feed': FacesFeed,
  'wallet': withUser(WalletView),
  'editorial': AdvertorialFeed,
  'editorial-detail': EditorialDetail,
  'ad-checkout': AdCheckout,
  'merchant-portal': withMerchant(MerchantPortal),
  'register': Register,
  'pricing': Pricing,
  'business-verification': withMerchant(BusinessVerification),
  'ad-manager': withMerchant(AdManager),
  'carry-me': CarryMe,
  'driver-console': withUser(DriverConsole),
  'purple-fleet': PurpleFleet,
  'driver-registry': DriverRegistry,
  'cargo': Logistics,
  'carry-go-dash': withUser(CarryGoDash),
  'fleet-admin': withAdmin(FleetAdmin),
  'admin': withAdmin(Admin),
  'srts-office': withAdmin(SandalsOffice),
  'lab': CreativeLab,
  'audio-heritage': AudioHeritage,
  'srts-dashboard': ThriftDashboard,
  'sandals-hotels': SandalsHotels,
  'booking-ledger': withAdmin(HotelLedger),
  'hotel-detail': SandalsHotels,
  'hotel-partner-control': withAdmin(HotelPartnerControl),
  'about-aba': AboutAba,
  'about': About,
  'about-who': About,
  'about-vision': About,
  'about-mission': About,
  'contact': Contact,
  'legal': Legal,
  'hardware-audit': withAdmin(HardwareAudit),
  'tech-setup': withAdmin(SetupConnection),
  'oracle': Oracle,
  'messages': ChatView,
  'login': Login,
  'signup': Signup,
  'profile': withUser(Profile),
  'onboarding': Onboarding,
  'support': SupportCenter,
  'buyer-portal': withUser(Profile),
  'registry-setup': withAdmin(SetupConnection),
  'orders': (props: any) => {
    const isMerchant = props.userRole === 'verified_business' || props.userRole === 'business_owner';
    return isMerchant ? withMerchant(MerchantPortal)(props) : withUser(BuyerOrdersView)(props);
  },
  'dispute-center': withMerchant(MerchantPortal)
};
