
import React from 'react';
import { AuthProvider } from './AuthProvider';
import { ConfigProvider } from './ConfigProvider';
import { BusinessProvider } from './BusinessProvider';
import { ToastProvider } from './ToastProvider';
import { OracleProvider } from './OracleProvider';
import { ChatProvider } from './ChatProvider';
import { LanguageProvider } from './LanguageProvider';
export * from './ChatProvider';
import { useAuth } from './AuthProvider';

const ChatProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userIdentifier, userName, userRole } = useAuth();
  return (
    <ChatProvider currentUser={{ 
      id: userIdentifier || 'guest', 
      displayName: userName || 'Citizen', 
      role: (userRole as any) || 'registered' 
    }}>
      {children}
    </ChatProvider>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <ConfigProvider>
            <BusinessProvider>
              <OracleProvider>
                <ChatProviderWrapper>
                  {children}
                </ChatProviderWrapper>
              </OracleProvider>
            </BusinessProvider>
          </ConfigProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export * from './AuthProvider';
export * from './ConfigProvider';
export * from './BusinessProvider';
export * from './ToastProvider';
export * from './OracleProvider';
export * from './LanguageProvider';

