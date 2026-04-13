
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  userIdentifier: string | null;
  userUuid: string | null;
  userName: string | null;
  userRole: string | null;
  isAuth: boolean;
  handleAuthSuccess: (identifier: string, name: string, role?: string, uuid?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userIdentifier, setUserIdentifier] = useState<string | null>(localStorage.getItem('findaba_user_id'));
  const [userUuid, setUserUuid] = useState<string | null>(localStorage.getItem('findaba_user_uuid'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('findaba_user_name'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('findaba_user_role'));
  const [isAuth, setIsAuth] = useState<boolean>(!!localStorage.getItem('findaba_user_id'));

  useEffect(() => {
    const storedId = localStorage.getItem('findaba_user_id');
    if (storedId === 'pastornelsonezi@gmail.com' || localStorage.getItem('findaba_user_uuid') === 'pastornelsonezi@gmail.com') {
      localStorage.setItem('findaba_user_role', 'admin');
      setUserRole('admin');
    }
  }, []);

  const handleAuthSuccess = useCallback((identifier: string, name: string, role: string = 'registered', uuid?: string) => {
    // 🔹 Admin Bootstrap Protocol
    let finalRole = role;
    if (identifier === 'pastornelsonezi@gmail.com' || uuid === 'pastornelsonezi@gmail.com') {
      finalRole = 'admin';
    }

    localStorage.setItem('findaba_user_id', identifier);
    if (uuid) {
      localStorage.setItem('findaba_user_uuid', uuid);
      setUserUuid(uuid);
    }
    
    if (identifier.includes('@')) {
      localStorage.setItem('findaba_user_email', identifier);
    } else {
      localStorage.setItem('findaba_user_phone', identifier);
    }
    localStorage.setItem('findaba_user_name', name);
    localStorage.setItem('findaba_user_role', finalRole);
    localStorage.setItem('findaba_is_auth', 'true');
    setUserIdentifier(identifier);
    setUserName(name);
    setUserRole(finalRole);
    setIsAuth(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('findaba_user_id');
    localStorage.removeItem('findaba_user_uuid');
    localStorage.removeItem('findaba_user_email');
    localStorage.removeItem('findaba_user_name');
    localStorage.removeItem('findaba_user_role');
    localStorage.removeItem('findaba_is_auth');
    setUserIdentifier(null);
    setUserUuid(null);
    setUserName(null);
    setUserRole(null);
    setIsAuth(false);
  }, []);

  return (
    <AuthContext.Provider value={{ userIdentifier, userUuid, userName, userRole, isAuth, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
