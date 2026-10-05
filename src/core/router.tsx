
import React, { lazy } from 'react';
import { ViewState } from '../types';
import ProtectedRoute from '../components/ProtectedRoute';
import Home from '../features/discovery/Home';

// Primary Landing Route is eagerly loaded to prevent any dynamic import chunk failures
export { Home };

/**
 * Resilient lazy loader that retries failed dynamic imports
 * (recovers from server restarts, temporary network glitches, or stale bundle hashes).
 */
function resilientLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 400
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), interval);
            } else {
              const isChunkError =
                error?.message?.includes('dynamically imported module') ||
                error?.message?.includes('Loading chunk') ||
                error?.name === 'ChunkLoadError';

              if (
                typeof window !== 'undefined' &&
                isChunkError &&
                !sessionStorage.getItem('chunk_reload_retry')
              ) {
                sessionStorage.setItem('chunk_reload_retry', 'true');
                window.location.reload();
                return;
              }
              reject(error);
            }
          });
      };
      attempt(retries);
    })
  );
}

// Feature-based Resilient Lazy Loading for secondary routes
export const Discover = resilientLazy(() => import('../features/discovery/Discover'));
export const Explore = resilientLazy(() => import('../features/discovery/Explore'));
export const BusinessDetail = resilientLazy(() => import('../features/discovery/BusinessDetail'));
export const Feed = resilientLazy(() => import('../features/discovery/Feed'));
export const FacesFeed = resilientLazy(() => import('../features/faces/FacesFeed'));
export const WalletView = resilientLazy(() => import('../features/finance/WalletView'));
export const AdvertorialFeed = resilientLazy(() => import('../features/discovery/AdvertorialFeed'));
export const AdvertorialDetail = resilientLazy(() => import('../features/discovery/AdvertorialDetail'));
export const EditorialDetail = resilientLazy(() => import('../features/discovery/EditorialDetail'));
export const AdCheckout = resilientLazy(() => import('../features/discovery/AdCheckout'));

export const MerchantPortal = resilientLazy(() => import('../features/merchant/MerchantPortal'));
export const Register = resilientLazy(() => import('../features/merchant/Register'));
export const Pricing = resilientLazy(() => import('../features/merchant/Pricing'));
export const BusinessVerification = resilientLazy(() => import('../features/merchant/BusinessVerification'));
export const AdManager = resilientLazy(() => import('../features/merchant/AdManager'));

export const CarryMe = resilientLazy(() => import('../features/logistics/CarryMe'));
export const DriverConsole = resilientLazy(() => import('../features/logistics/DriverConsole'));
export const PurpleFleet = resilientLazy(() => import('../features/logistics/PurpleFleet'));
export const DriverRegistry = resilientLazy(() => import('../features/logistics/DriverRegistry'));
export const Logistics = resilientLazy(() => import('../features/logistics/Logistics'));
export const CarryGoDash = resilientLazy(() => import('../features/logistics/CarryGoDash'));
export const FleetAdmin = resilientLazy(() => import('../features/logistics/FleetAdmin'));

export const Admin = resilientLazy(() => import('../features/admin/Admin'));
export const SandalsOffice = resilientLazy(() => import('../features/admin/SandalsOffice'));

export const CreativeLab = resilientLazy(() => import('../features/creative/CreativeLab'));
export const AudioHeritage = resilientLazy(() => import('../features/creative/AudioHeritage'));

export const ThriftDashboard = resilientLazy(() => import('../features/finance/ThriftDashboard'));

export const SandalsHotels = resilientLazy(() => import('../features/hospitality/SandalsHotels'));
export const HotelLedger = resilientLazy(() => import('../features/hospitality/HotelLedger'));
export const HotelPartnerControl = resilientLazy(() => import('../features/hospitality/HotelPartnerControl'));

export const AboutAba = resilientLazy(() => import('../features/info/AboutAba'));
export const About = resilientLazy(() => import('../features/info/About'));
export const Contact = resilientLazy(() => import('../features/info/Contact'));
export const Legal = resilientLazy(() => import('../features/info/Legal'));

export const HardwareAudit = resilientLazy(() => import('../features/tech/HardwareAudit'));
export const SetupConnection = resilientLazy(() => import('../features/tech/SetupConnection'));

export const Oracle = resilientLazy(() => import('../features/oracle/Oracle'));
export const ChatView = resilientLazy(() => import('../features/oracle/ChatView'));

export const Login = resilientLazy(() => import('../features/auth/Login'));
export const Signup = resilientLazy(() => import('../pages/Signup'));
export const Profile = resilientLazy(() => import('../features/auth/Profile'));
export const Onboarding = resilientLazy(() => import('../features/auth/Onboarding'));
export const SupportCenter = resilientLazy(() => import('../features/support/SupportCenter'));
export const LocalSearchPage = resilientLazy(() => import('../features/discovery/LocalSearchPage'));

export const BuyerOrdersView = resilientLazy(() => import('../features/finance/BuyerOrdersView'));

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
  'find': LocalSearchPage,
  'buyer-portal': withUser(Profile),
  'registry-setup': withAdmin(SetupConnection),
  'orders': (props: any) => {
    const isMerchant = props.userRole === 'verified_business' || props.userRole === 'business_owner';
    return isMerchant ? withMerchant(MerchantPortal)(props) : withUser(BuyerOrdersView)(props);
  },
  'dispute-center': withMerchant(MerchantPortal)
};
