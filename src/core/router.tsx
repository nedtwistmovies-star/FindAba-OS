
import { ViewState } from '../types';
import { lazy } from 'react';

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

export const Oracle = lazy(() => import('../features/oracle/Oracle'));
export const ChatView = lazy(() => import('../features/oracle/ChatView'));

export const Login = lazy(() => import('../features/auth/Login'));
export const Signup = lazy(() => import('../pages/Signup'));
export const Profile = lazy(() => import('../features/auth/Profile'));
export const Onboarding = lazy(() => import('../features/auth/Onboarding'));
export const SupportCenter = lazy(() => import('../features/support/SupportCenter'));

export const BuyerOrdersView = lazy(() => import('../features/finance/BuyerOrdersView'));
export const ROUTE_MAP: Record<ViewState, any> = {
  'home': Home,
  'discover': Discover,
  'explore': Explore,
  'detail': BusinessDetail,
  'feed': FacesFeed,
  'wallet': WalletView,
  'editorial': AdvertorialFeed,
  'editorial-detail': EditorialDetail,
  'ad-checkout': AdCheckout,
  'merchant-portal': MerchantPortal,
  'register': Register,
  'pricing': Pricing,
  'business-verification': BusinessVerification,
  'ad-manager': AdManager,
  'carry-me': CarryMe,
  'driver-console': DriverConsole,
  'purple-fleet': PurpleFleet,
  'driver-registry': DriverRegistry,
  'cargo': Logistics,
  'carry-go-dash': CarryGoDash,
  'fleet-admin': FleetAdmin,
  'admin': Admin,
  'srts-office': SandalsOffice,
  'lab': CreativeLab,
  'audio-heritage': AudioHeritage,
  'srts-dashboard': ThriftDashboard,
  'sandals-hotels': SandalsHotels,
  'booking-ledger': HotelLedger,
  'hotel-detail': SandalsHotels,
  'hotel-partner-control': HotelPartnerControl,
  'about-aba': AboutAba,
  'about': About,
  'about-who': About,
  'about-vision': About,
  'about-mission': About,
  'contact': Contact,
  'legal': Legal,
  'hardware-audit': HardwareAudit,
  'oracle': Oracle,
  'messages': ChatView,
  'login': Login,
  'signup': Signup,
  'profile': Profile,
  'onboarding': Onboarding,
  'support': SupportCenter,
  'buyer-portal': Profile,
  'registry-setup': Register,
  'orders': (props: any) => {
    const isMerchant = props.userRole === 'verified_business' || props.userRole === 'business_owner';
    return isMerchant ? <MerchantPortal {...props} /> : <BuyerOrdersView {...props} />;
  },
  'dispute-center': MerchantPortal
};
