
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

  const updateBootDiagnostics = (updates: Partial<BootDiagnostics>) => {
    setBootDiagnostics(prev => ({ ...prev, ...updates }));
  };

  const handleAuthSuccess = useCallback((identifier: string, name: string, role: string = 'registered', uuid?: string) => {
    if (uuid) setUserId(uuid);
    setUserIdentifier(identifier);
    setUserName(name);
    setUserRole(role);
    setIsAuth(true);
    setAuthLoading(false);
  }, []);

  const logout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUserIdentifier(null);
    setUserId(null);
    setUserName(null);
    setUserRole(null);
    setProfile(null);
    setIsAuth(false);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      try {
        const sb = getSupabase();
        if (!sb) {
          setAuthLoading(false);
          updateBootDiagnostics({ authEvent: 'REGISTRY_OFFLINE' });
          return;
        }

        updateBootDiagnostics({ authListenerActive: true });
        
        console.log('STEP_3_BEFORE_GET_SESSION');
        
        // 🔹 TIMEOUT_PROTECTED_GET_SESSION
        const sessionResponse = await Promise.race([
          sb.auth.getSession(),
          new Promise((resolve) => 
            setTimeout(() => resolve({ data: { session: null }, error: { message: 'SESSION_TIMEOUT_EXCEEDED' } }), 15000)
          )
        ]) as any;
        
        console.log('STEP_4_AFTER_GET_SESSION');
        const { data: { session }, error: sessionError } = sessionResponse;
        
        if (sessionError && sessionError.message === 'SESSION_TIMEOUT_EXCEEDED') {
          console.warn("[AuthProvider] Session load timed out after 15s. Proceeding as unauthenticated.");
          updateBootDiagnostics({ authEvent: 'TIMEOUT', corruptionMetadata: 'getSession timed out' });
        }
        
        console.log('RAW_SESSION:', session);
        console.log('RAW_USER:', session?.user);
        console.log('SESSION_KEYS:', Object.keys(session || {}));
        console.log('RAW_SESSION_EXISTS:', !!session);
        console.log('RAW_SESSION_USER_EXISTS:', !!session?.user);
        console.log('RAW_SESSION_USER_ID:', session?.user?.id || 'NULL');
        console.log('RAW_SESSION_EMAIL:', session?.user?.email || 'NULL');

        const diag: Partial<BootDiagnostics> = {
          sessionExists: !!session,
          sessionUserExists: !!session?.user,
          sessionUserId: session?.user?.id || 'NULL',
          sessionEmail: session?.user?.email || 'NULL',
          rawSession: session,
          rawUser: session?.user,
          getSessionKeys: Object.keys(session || {}),
          authEvent: 'SESSION_LOADED',
          finalRouteDecision: session?.user ? 'AUTHORIZED' : 'GUEST_ACCESS'
        };

        // Corruption Detection
        if (!!session && !session.user) {
          diag.sessionCorruptionDetected = true;
          diag.sessionCorruptionConfirmed = true;
          diag.sessionCorruptionSource = 'supabase.auth.getSession() -> session is truthy but user is null';
          diag.routeBypassTriggered = true;
          diag.finalRouteDecision = 'LOGIN';
          diag.corruptionMetadata = 'SESSION_FOUND = TRUE while SESSION_USER_EXISTS = FALSE | AuthProvider.tsx:101';
          
          console.error("SESSION_CORRUPTION_DETECTED: TRUE");
          console.error("SESSION_CORRUPTION_CONFIRMED: TRUE");
          console.error("SESSION_CORRUPTION_SOURCE:", diag.sessionCorruptionSource);
          console.error("ROUTE_BYPASS_TRIGGERED: TRUE");
          console.error("FORCE_NAVIGATE_LOGIN: TRUE");
          console.error("FINAL_ROUTE_DECISION: LOGIN");
          
          updateBootDiagnostics(diag);
          return; // Termination logic - finally will release gate
        }

        setHasSession(!!session);
        updateBootDiagnostics(diag);

        if (session?.user) {
          console.log('STEP_5_BEFORE_PROFILE_SYNC');
          
          // 🔹 TIMEOUT_PROTECTED_PROFILE_SYNC
          const prof = await syncProfile(session.user).catch(() => null);
          
          console.log('STEP_6_AFTER_PROFILE_SYNC');
          setProfile(prof);
          
          handleAuthSuccess(
            session.user.email || '',
            prof?.full_name || session.user.user_metadata?.full_name || 'User',
            prof?.role || 'registered',
            session.user.id
          );
          
          // Final Sync Update
          updateBootDiagnostics({ authEvent: 'PROFILE_SYNCED' });
        } else if (session && !session.user) {
           // Bypassing profile sync if session resolves but user is null
           console.log("ROUTE_BYPASS_TRIGGERED: getSession() resolved but session.user is null. Bypassing sync.");
           updateBootDiagnostics({ routeBypassTriggered: true, finalRouteDecision: 'GUEST_ACCESS' });
        }

      } catch (e) {
        console.error("[AuthProvider] Init error:", e);
        updateBootDiagnostics({ authEvent: 'ERROR', corruptionMetadata: String(e) });
      } finally {
        console.log('STEP_7_RELEASING_GATE');
        setAuthLoading(false);
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
          const prof = await syncProfile(session.user).catch(() => null);
          setProfile(prof);
          handleAuthSuccess(
            session.user.email || '',
            prof?.full_name || 'User',
            prof?.role || 'registered',
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
