
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
  currentStep: string;
  lastStep: string;
  handleAuthSuccess: (identifier: string, name: string, role?: string, uuid?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bootId] = useState(() => Math.random().toString(36).substring(7));
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null);
  const [user_id, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<string>('booting');
  const [lastStep, setLastStep] = useState<string>('INIT');

  const updateWatchdog = useCallback((step: string) => {
    (window as any).__BOOT_STEP = step;
    (window as any).__BOOT_TIME = Date.now();
    (window as any).__BOOT_TRACE = [...((window as any).__BOOT_TRACE || []), `${new Date().toLocaleTimeString()}: ${step}`].slice(-10);
    setCurrentStep(step);
    setLastStep(prev => (step.includes('error') || step === 'finalized' || step === 'success') ? prev : step);
    console.log(`[WATCHDOG] 🚀 STEP_CHANGE: ${step}`);
  }, []);

  useEffect(() => {
    console.log(`[AuthProvider] [${bootId}] MOUNTED`);
    console.log('AUTH_PROVIDER_MOUNTED');
    return () => console.log(`[AuthProvider] [${bootId}] UNMOUNTED`);
  }, [bootId]);

  useEffect(() => {
    const handleForceRelease = () => {
      console.warn(`[AuthProvider] [${bootId}] External Gate Release Triggered.`);
      updateWatchdog('forced_release');
      setAuthLoading(false);
    };
    window.addEventListener('FORCE_GATE_RELEASE', handleForceRelease);
    return () => window.removeEventListener('FORCE_GATE_RELEASE', handleForceRelease);
  }, [bootId, updateWatchdog]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("[AuthProvider] 🛡️ STATUS_HEARTBEAT:", {
        authLoading,
        isAuth,
        hasUserId: !!user_id,
        hasProfile: !!profile,
        currentStep
      });
    }, 2000);
    return () => clearInterval(intervalId);
  }, [authLoading, isAuth, user_id, profile, currentStep]);

  useEffect(() => {
    const initAuth = async () => {
      const startTime = Date.now();
      updateWatchdog('handshake_started');
      setAuthLoading(true);
      
      const timeoutId = setTimeout(() => {
        const duration = Date.now() - startTime;
        console.warn(`[AuthProvider] [${bootId}] ⚠️ HANDSHAKE_STALL_DETECTED at ${duration}ms. Forcing gate release.`);
        updateWatchdog('timeout_fallback');
        setAuthLoading(false);
      }, 45000);

      try {
        updateWatchdog('obtaining_client');
        const sb = getSupabase();
        if (!sb) {
          updateWatchdog('client_offline');
          setIsAuth(false);
          setAuthLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        console.time('getSession');
        const getSessionStartTime = Date.now();
        console.log(`[AuthProvider] [${new Date(getSessionStartTime).toISOString()}] GETSESSION_STARTED`);
        updateWatchdog('fetching_session');
        
        const result = await sb.auth.getSession();
        const getSessionEndTime = Date.now();
        console.log(`[AuthProvider] [${new Date(getSessionEndTime).toISOString()}] GETSESSION_RESOLVED`);
        
        const { data: { session }, error: sessionError } = result;
        
        const forensics = {
          SESSION_EXISTS: !!session,
          USER_EXISTS: !!session?.user,
          SESSION_EMAIL: session?.user?.email || 'NULL',
          USER_EMAIL: session?.user?.email || 'NULL',
          USER_ID: session?.user?.id || 'NULL',
          SESSION_KEYS: Object.keys(session || {}),
          USER_KEYS: Object.keys(session?.user || {}),
          TIMELINE: {
            GETSESSION_STARTED: new Date(getSessionStartTime).toLocaleTimeString(),
            GETSESSION_RESOLVED: new Date(getSessionEndTime).toLocaleTimeString(),
            GETSESSION_ERROR: sessionError ? sessionError.message : 'NONE'
          }
        };
        (window as any).__AUTH_FORENSICS = forensics;

        console.log("SESSION_RAW", session);
        console.log("USER_RAW", session?.user);
        console.log("SESSION_KEYS", forensics.SESSION_KEYS);
        console.log("USER_KEYS", forensics.USER_KEYS);
        console.log("SESSION_EXISTS", forensics.SESSION_EXISTS);
        console.log("USER_EXISTS", forensics.USER_EXISTS);
        console.log("USER_ID", forensics.USER_ID);
        console.log("SESSION_EMAIL", forensics.SESSION_EMAIL);

        if (session && !session.user) {
          console.error("🛑 AUTH_OBJECT_CORRUPTED: Session exists but user is missing!");
          updateWatchdog('auth_object_corrupted');
          setTimeout(() => {
             console.warn("[AuthProvider] Forcing gate release due to corruption...");
             setAuthLoading(false);
          }, 5000);
        }

        console.timeEnd('getSession');
        updateWatchdog('session_retrieved');
        setHasSession(!!session);
        
        if (sessionError) {
          console.error(`[AuthProvider] [${bootId}] ❌ SESSION_FAULT:`, sessionError);
          updateWatchdog('session_error');
        }

        if (session?.user) {
          updateWatchdog('syncing_profile');
          const user = session.user;
          
          try {
            console.time('syncProfile');
            // Allow more time for sync but don't hard-reject the whole boot if it fails
            const prof = await syncProfile(user).catch(err => {
              console.warn("[AuthProvider] Profile sync failed, proceeding with user only:", err);
              return null;
            });
            console.timeEnd('syncProfile');
            updateWatchdog('profile_synced');
            setProfile(prof);
            
            const identifier = user.email || user.phone || '';
            const name = (prof as any)?.full_name || user.user_metadata?.full_name || 'Verified Citizen';
            const role = (prof as any)?.role || 'registered';
            
            updateWatchdog('success');
            handleAuthSuccess(identifier, name, role, user.id);
          } catch (profileError) {
            console.error(`[AuthProvider] [${bootId}] ⚠️ PROFILE_SYNC_FAULT:`, profileError);
            updateWatchdog('profile_sync_error');
            handleAuthSuccess(user.email || '', 'Verified User', 'registered', user.id);
          }
        } else {
          updateWatchdog('no_session');
          setIsAuth(false);
        }
      } catch (e) {
        console.error(`[AuthProvider] [${bootId}] 🛑 CRITICAL_HANDSHAKE_FATAL:`, e);
        updateWatchdog('critical_fatal');
        setIsAuth(false);
      } finally {
        updateWatchdog('finalized');
        clearTimeout(timeoutId);
        setAuthLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const sb = getSupabase();
    if (sb) {
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setHasSession(true);
          const prof = await syncProfile(session.user);
          setProfile(prof);
          handleAuthSuccess(
            session.user.email || session.user.phone || '',
            prof?.full_name || session.user.user_metadata?.full_name || 'Verified Citizen',
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
  }, []);

  const handleAuthSuccess = useCallback((identifier: string, name: string, role: string = 'registered', uuid?: string) => {
    // 🔹 Admin Bootstrap Protocol
    let finalRole = role;
    if (identifier === 'pastornelsonezi@gmail.com') {
      finalRole = 'admin';
    }

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (uuid && isUUID(uuid)) {
      setUserId(uuid);
    }
    
    setUserIdentifier(identifier);
    setUserName(name);
    setUserRole(finalRole);
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

  return (
    <AuthContext.Provider value={{ userIdentifier, user_id, userName, userRole, profile, hasSession, isAuth, authLoading, currentStep, lastStep, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
