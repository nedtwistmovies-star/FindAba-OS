import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useBusiness } from '../providers/BusinessProvider';

export type AppRole = 'admin' | 'merchant' | 'public' | 'user';

export interface RoleGuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  role: AppRole;
  isAdmin: boolean;
  isMerchant: boolean;
  isPublic: boolean;
  user_id: string | null;
  userEmail: string | null;
  userRole: string | null;
  profile: any | null;
  checkAccess: (permittedRoles: Array<AppRole | string>) => boolean;
  reason?: string;
}

const MASTER_ADMIN_EMAIL = 'pastornelsonezi@gmail.com';

/**
 * useRoleGuard
 * Authoritative role verification hook.
 * Inspects authenticated session, user metadata, and profile state.
 * Standardizes access checks across all components and navigation layers.
 */
export function useRoleGuard(allowedRoles: Array<AppRole | string> = []): RoleGuardResult {
  const { isAuth, authLoading, userRole, userIdentifier, user_id, profile } = useAuth();
  const { businesses = [] } = useBusiness();

  const email = (userIdentifier || profile?.email || '').toLowerCase().trim();

  // 1. Authoritative Admin Determination
  const isAdmin = useMemo(() => {
    if (!isAuth) return false;
    if (email === MASTER_ADMIN_EMAIL) return true;
    if (userRole === 'admin' || userRole === 'superadmin') return true;
    if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) return true;
    return false;
  }, [isAuth, email, userRole, profile]);

  // 2. Authoritative Merchant Determination
  const isMerchant = useMemo(() => {
    if (!isAuth) return false;
    if (isAdmin) return true; // Admins inherit merchant supervision capability
    if (userRole === 'verified_business' || userRole === 'business_owner' || userRole === 'merchant') return true;
    if (profile && (profile.role === 'verified_business' || profile.role === 'business_owner' || profile.role === 'merchant')) return true;
    if (profile?.business_id) return true;
    // Check if user owns at least one business in the registry
    if (user_id && Array.isArray(businesses) && businesses.some((b: any) => b.user_id === user_id || b.owner_id === user_id)) {
      return true;
    }
    return false;
  }, [isAuth, isAdmin, userRole, profile, user_id, businesses]);

  // 3. Current Effective Role
  const effectiveRole: AppRole = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isMerchant) return 'merchant';
    if (isAuth) return 'user';
    return 'public';
  }, [isAdmin, isMerchant, isAuth]);

  // 4. Permission Checker Function
  const checkAccess = useMemo(() => {
    return (permitted: Array<AppRole | string>): boolean => {
      if (!permitted || permitted.length === 0) return true;
      if (permitted.includes('*') || permitted.includes('all')) return true;

      // Public access allows anyone
      if (permitted.includes('public')) return true;

      // Any authenticated user
      if (permitted.includes('user') && isAuth) return true;

      // Merchant permissions
      if (permitted.includes('merchant') && isMerchant) return true;

      // Admin permissions
      if (permitted.includes('admin') && isAdmin) return true;

      // Exact match with profile/metadata role
      if (userRole && permitted.includes(userRole)) return true;
      if (profile?.role && permitted.includes(profile.role)) return true;

      return false;
    };
  }, [isAdmin, isMerchant, isAuth, userRole, profile]);

  const isAuthorized = useMemo(() => {
    if (allowedRoles.length === 0) return true;
    return checkAccess(allowedRoles);
  }, [allowedRoles, checkAccess]);

  let reason: string | undefined;
  if (!authLoading && !isAuthorized) {
    if (!isAuth) {
      reason = 'Authentication required to access this resource.';
    } else if (allowedRoles.includes('admin') && !isAdmin) {
      reason = 'Administrator privileges required.';
    } else if (allowedRoles.includes('merchant') && !isMerchant) {
      reason = 'Merchant or registered business profile required.';
    } else {
      reason = 'Access restricted.';
    }
  }

  return {
    isAuthorized,
    isLoading: authLoading,
    role: effectiveRole,
    isAdmin,
    isMerchant,
    isPublic: !isAuth,
    user_id,
    userEmail: userIdentifier,
    userRole,
    profile,
    checkAccess,
    reason,
  };
}

export default useRoleGuard;
