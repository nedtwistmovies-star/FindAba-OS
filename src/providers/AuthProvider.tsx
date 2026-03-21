
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  userIdentifier: string | null;
  userName: string | null;
  userRole: string | null;
  isAuth: boolean;
  handleAuthSuccess: (email: string, name: string, role?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userIdentifier, setUserIdentifier] = useState<string | null>(localStorage.getItem('findaba_user_id'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('findaba_user_name'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('findaba_user_role'));
  const [isAuth, setIsAuth] = useState<boolean>(!!localStorage.getItem('findaba_user_id'));

  const handleAuthSuccess = useCallback((email: string, name: string, role: string = 'registered') => {
    localStorage.setItem('findaba_user_id', email);
    localStorage.setItem('findaba_user_email', email);
    localStorage.setItem('findaba_user_name', name);
    localStorage.setItem('findaba_user_role', role);
    localStorage.setItem('findaba_is_auth', 'true');
    setUserIdentifier(email);
    setUserName(name);
    setUserRole(role);
    setIsAuth(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('findaba_user_id');
    localStorage.removeItem('findaba_user_email');
    localStorage.removeItem('findaba_user_name');
    localStorage.removeItem('findaba_user_role');
    localStorage.removeItem('findaba_is_auth');
    setUserIdentifier(null);
    setUserName(null);
    setUserRole(null);
    setIsAuth(false);
  }, []);

  return (
    <AuthContext.Provider value={{ userIdentifier, userName, userRole, isAuth, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
