
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../services/supabaseService';
import { syncProfile } from '../services/authService';

interface AuthContextType {
  userIdentifier: string | null;
  user_id: string | null;
  userName: string | null;
  userRole: string | null;
  profile: any | null;
  isAuth: boolean;
  handleAuthSuccess: (identifier: string, name: string, role?: string, uuid?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userIdentifier, setUserIdentifier] = useState<string | null>(localStorage.getItem('findaba_user_login'));
  const [user_id, setUserId] = useState<string | null>(localStorage.getItem('findaba_user_id'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('findaba_user_name'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('findaba_user_role'));
  const [profile, setProfile] = useState<any | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(!!localStorage.getItem('findaba_user_id'));

  useEffect(() => {
    const initAuth = async () => {
      const sb = getSupabase();
      if (!sb) return;

      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const user = session.user;
        
        // Sync Profile from DB
        const prof = await syncProfile(user);
        setProfile(prof);
        
        const identifier = user.email || user.phone || '';
        const name = prof?.full_name || user.user_metadata.full_name || 'Verified Citizen';
        const role = prof?.role || 'registered';
        const uuid = user.id;
        
        handleAuthSuccess(identifier, name, role, uuid);
      }
    };

    initAuth();

    const stored_login = localStorage.getItem('findaba_user_login');
    if (stored_login === 'pastornelsonezi@gmail.com') {
      localStorage.setItem('findaba_user_role', 'admin');
      setUserRole('admin');
    }
  }, []);

  const handleAuthSuccess = useCallback((identifier: string, name: string, role: string = 'registered', uuid?: string) => {
    // 🔹 Admin Bootstrap Protocol
    let finalRole = role;
    if (identifier === 'pastornelsonezi@gmail.com') {
      finalRole = 'admin';
    }

    localStorage.setItem('findaba_user_login', identifier);
    if (uuid) {
      localStorage.setItem('findaba_user_id', uuid);
      setUserId(uuid);
    }
    
    if (identifier.includes('@')) {
      localStorage.setItem('findaba_user_email', identifier);
      localStorage.removeItem('findaba_user_phone');
    } else {
      localStorage.setItem('findaba_user_phone', identifier);
      localStorage.removeItem('findaba_user_email');
    }
    localStorage.setItem('findaba_user_name', name);
    localStorage.setItem('findaba_user_role', finalRole);
    localStorage.setItem('findaba_is_auth', 'true');
    setUserIdentifier(identifier);
    setUserName(name);
    setUserRole(finalRole);
    setIsAuth(true);
  }, []);

  const logout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();

    localStorage.removeItem('findaba_user_login');
    localStorage.removeItem('findaba_user_id');
    localStorage.removeItem('findaba_user_email');
    localStorage.removeItem('findaba_user_name');
    localStorage.removeItem('findaba_user_role');
    localStorage.removeItem('findaba_is_auth');
    setUserIdentifier(null);
    setUserId(null);
    setUserName(null);
    setUserRole(null);
    setIsAuth(false);
  }, []);

  return (
    <AuthContext.Provider value={{ userIdentifier, user_id, userName, userRole, profile, isAuth, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
