
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseService';
import { syncProfile } from '../services/authService';

interface AuthContextType {
  userIdentifier: string | null;
  user_id: string | null;
  userName: string | null;
  userRole: string | null;
  profile: any | null;
  hasSession: boolean;
  isAuth: boolean;
  authLoading: boolean;
  handleAuthSuccess: (identifier: string, name: string, role?: string, uuid?: string) => void;
  logout: () => void;
  bootDiagnostics: BootDiagnostics;
}

export interface BootDiagnostics {
  sessionExists: boolean;
  sessionUserExists: boolean;
  sessionUserId: string;
  sessionEmail: string;
  authEvent: string;
  authListenerActive: boolean;
  rawSession: any;
  rawUser: any;
  rawGetSessionData: any;
  getSessionKeys: string[];
  authStateChangeEvent: string;
  sessionCorruptionDetected: boolean;
  sessionCorruptionConfirmed: boolean;
  sessionCorruptionSource: string;
  corruptionMetadata: string;
  routeBypassTriggered: boolean;
  finalRouteDecision: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('STEP_2_AUTH_PROVIDER_RENDER');
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null);
  const [user_id, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [bootStatus, setBootStatus] = useState<'BOOTING' | 'READY'>('BOOTING');

  const [bootDiagnostics, setBootDiagnostics] = useState<BootDiagnostics>({
    sessionExists: false,
    sessionUserExists: false,
    sessionUserId: 'NULL',
    sessionEmail: 'NULL',
    authEvent: 'INIT',
    authListenerActive: false,
    rawSession: null,
    rawUser: null,
    rawGetSessionData: null,
    getSessionKeys: [],
    authStateChangeEvent: 'NONE',
    sessionCorruptionDetected: false,
    sessionCorruptionConfirmed: false,
    sessionCorruptionSource: '',
    corruptionMetadata: '',
    routeBypassTriggered: false,
    finalRouteDecision: 'PENDING'
  });

  // 🔹 PROGRESSIVE BOOT: Release gate if initialization hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bootStatus === 'BOOTING') {
        console.warn("[Auth] Initialization taking too long. Releasing gate as guest fallback.");
        setAuthLoading(false);
        setBootStatus('READY');
      }
    }, 5000); // Increased to 5s for slower connections
    return () => clearTimeout(timer);
  }, [bootStatus]);

  const updateBootDiagnostics = (updates: Partial<BootDiagnostics>) => {
    setBootDiagnostics(prev => ({ ...prev, ...updates }));
  };

  const handleAuthSuccess = useCallback((identifier: string, name: string, role: string = 'registered', uuid?: string) => {
    if (uuid) {
      setUserId(uuid);
      localStorage.setItem('findaba_auth_userid', uuid);
    }
    setUserIdentifier(identifier);
    setUserName(name);
    setUserRole(role);
    setIsAuth(true);
    setAuthLoading(false);

    localStorage.setItem('findaba_is_auth', 'true');
    localStorage.setItem('findaba_auth_email', identifier);
    localStorage.setItem('findaba_auth_name', name);
    localStorage.setItem('findaba_auth_role', role);
  }, []);

  const logout = useCallback(async () => {
    const sb = getSupabase();
    try {
      if (sb) await sb.auth.signOut();
    } catch (e) {
      console.warn("SignOut failed, clearing local keys anyway:", e);
    }
    setUserIdentifier(null);
    setUserId(null);
    setUserName(null);
    setUserRole(null);
    setProfile(null);
    setIsAuth(false);

    localStorage.removeItem('findaba_is_auth');
    localStorage.removeItem('findaba_auth_email');
    localStorage.removeItem('findaba_auth_name');
    localStorage.removeItem('findaba_auth_role');
    localStorage.removeItem('findaba_auth_userid');
    localStorage.removeItem('findaba_admin_auth');
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      setBootStatus('BOOTING');
      try {
        const sb = getSupabase();
        if (!sb) {
          setAuthLoading(false);
          setBootStatus('READY');
          updateBootDiagnostics({ authEvent: 'REGISTRY_OFFLINE' });
          return;
        }

        updateBootDiagnostics({ authListenerActive: true });
        
        // 🔹 TIMEOUT_PROTECTED_GET_SESSION
        const hasStoredAuth = typeof localStorage !== 'undefined' && (
          localStorage.getItem('findaba_is_auth') === 'true' ||
          Object.keys(localStorage).some(k => k.includes('auth-token') || k.startsWith('sb-'))
        );
        const SESSION_TIMEOUT = hasStoredAuth ? 8000 : 3500;
        console.log('STEP_3_BEFORE_GET_SESSION');
        
        let isResolved = false;
        let timeoutHandle: any = null;
        const sessionResponse = await Promise.race([
          sb.auth.getSession().then((res: any) => {
            isResolved = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            return res;
          }).catch((err: any) => {
            isResolved = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            throw err;
          }),
          new Promise((resolve) => {
            timeoutHandle = setTimeout(() => {
              if (isResolved) return;
              console.warn(`[AuthProvider] SESSION_TIMEOUT_EXCEEDED | getSession exceeded ${SESSION_TIMEOUT}ms`);
              resolve({ data: { session: null }, error: { message: 'SESSION_TIMEOUT_EXCEEDED' } });
            }, SESSION_TIMEOUT);
          })
        ]) as any;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        
        const { data: { session }, error: sessionError } = sessionResponse;
        
        if (sessionError && sessionError.message === 'SIGN_IN_TIMEOUT') {
          console.warn("[AuthProvider] Signing you in took longer than expected. Proceeding as guest.");
          updateBootDiagnostics({ authEvent: 'TIMEOUT', corruptionMetadata: 'Your sign-in took longer than expected' });
        }
        
        console.log('RAW_SESSION:', session);
        console.log('RAW_USER:', session?.user);
        
        const diag: Partial<BootDiagnostics> = {
          sessionExists: !!session,
          sessionUserExists: !!session?.user,
          sessionUserId: session?.user?.id || 'NULL',
          sessionEmail: session?.user?.email || 'NULL',
          rawSession: session,
          rawUser: session?.user,
          getSessionKeys: Object.keys(session || {}),
          authEvent: 'SESSION_LOADED',
          finalRouteDecision: session?.user ? 'AUTHORIZED' : (session ? 'GUEST_ACCESS' : 'LOGIN')
        };

        // Corruption Detection
        if (!!session && !session.user) {
          diag.sessionCorruptionDetected = true;
          diag.sessionCorruptionConfirmed = true;
          diag.sessionCorruptionSource = 'supabase.auth.getSession() -> unexpected state';
          diag.routeBypassTriggered = true;
          diag.finalRouteDecision = 'LOGIN';
          diag.corruptionMetadata = 'Authentication required | AuthProvider.tsx';
          
          updateBootDiagnostics(diag);
          return;
        }

        setHasSession(!!session);
        updateBootDiagnostics(diag);

        // 🔹 ASYNCHRONOUS BACKGROUND ASSETS
        if (session?.user) {
          // 1. Immediate optimistic auth success using session data and cached role
          const isPastor = session.user.email === 'pastornelsonezi@gmail.com';
          const storedRole = localStorage.getItem('findaba_auth_role');
          const initialRole = isPastor ? 'admin' : (session.user.user_metadata?.role || storedRole || 'registered');
          const initialName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';

          handleAuthSuccess(
            session.user.email || '',
            initialName,
            initialRole,
            session.user.id
          );

          // 2. Progressive profile sync in background
          syncProfile(session.user)
            .then(prof => {
              if (prof) {
                setProfile(prof);
                handleAuthSuccess(
                  session.user.email || '',
                  prof.full_name || initialName,
                  prof.role || initialRole,
                  session.user.id
                );
                updateBootDiagnostics({ authEvent: 'PROFILE_SYNCED' });
              }
            })
            .catch(err => {
              console.warn("[AuthProvider] Background sync failed:", err);
            });
        } else if (localStorage.getItem('findaba_is_auth') === 'false') {
          // Explicit cleanup
          logout();
        }
        updateBootDiagnostics({ routeBypassTriggered: true, finalRouteDecision: 'GUEST_ACCESS' });

      } catch (e) {
        console.error("[AuthProvider] Init error:", e);
        updateBootDiagnostics({ authEvent: 'ERROR', corruptionMetadata: String(e) });
      } finally {
        console.log('STEP_7_RELEASING_GATE');
        setAuthLoading(false);
        setBootStatus('READY');
      }
    };

    initAuth();

    const sb = getSupabase();
    if (sb) {
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        console.log('AUTH_STATE_CHANGE_EVENT:', event);
        updateBootDiagnostics({ 
          authStateChangeEvent: event,
          sessionExists: !!session,
          sessionUserExists: !!session?.user,
          sessionUserId: session?.user?.id || 'NULL',
          sessionEmail: session?.user?.email || 'NULL',
          rawSession: session,
          rawUser: session?.user
        });

        if (event === 'SIGNED_IN' && session?.user) {
          setHasSession(true);
          // 🔹 ASYNCHRONOUS BACKGROUND ASSET SYNC
          // We no longer await this to prevent blocking the UI transition
          syncProfile(session.user)
            .then(prof => {
              if (prof) {
                setProfile(prof);
                handleAuthSuccess(
                  session.user?.email || '',
                  prof.full_name || 'User',
                  prof.role || 'registered',
                  session.user?.id
                );
              }
            })
            .catch(err => console.error("[AuthProvider] StateChange sync failed:", err));
          
          // Optimistic success with available session data
          handleAuthSuccess(
            session.user.email || '',
            session.user.user_metadata?.full_name || 'User',
            'registered',
            session.user.id
          );
        } else if (event === 'SIGNED_OUT') {
          setHasSession(false);
          setIsAuth(false);
          setProfile(null);
          setUserId(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [handleAuthSuccess]);

  return (
    <AuthContext.Provider value={{ 
      userIdentifier, 
      user_id, 
      userName, 
      userRole, 
      profile, 
      hasSession, 
      isAuth, 
      authLoading,
      handleAuthSuccess, 
      logout,
      bootDiagnostics
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
