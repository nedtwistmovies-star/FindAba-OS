
import React from 'react';
import { useRoleGuard, AppRole } from '../hooks/useRoleGuard';
import { useOracle } from '../providers/OracleProvider';
import { ShieldAlert, Store, Lock, ArrowLeft, Plus } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<AppRole | string>;
  fallbackView?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin'],
  fallbackView = 'home'
}) => {
  const { isAuthorized, isLoading, isAdmin, isMerchant, isPublic, reason } = useRoleGuard(allowedRoles);
  const { setView } = useOracle();

  if (isLoading) {
    return <LoadingScreen message="Verifying security credentials..." />;
  }

  if (!isAuthorized) {
    const requiresAdmin = allowedRoles.includes('admin') && !allowedRoles.includes('user') && !allowedRoles.includes('merchant');
    const requiresMerchant = allowedRoles.includes('merchant') && !allowedRoles.includes('user');

    if (requiresAdmin) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6 shadow-2xl">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Administrator Access Required
          </h2>
          <p className="text-white/50 text-xs max-w-md mx-auto leading-relaxed mb-8">
            This module is restricted to authorized FindAba platform administrators. Ordinary citizen and merchant accounts cannot access administrative operations.
          </p>
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> Return to City Hub
          </button>
        </div>
      );
    }

    if (requiresMerchant) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-2xl">
            <Store size={36} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Merchant Account Required
          </h2>
          <p className="text-white/50 text-xs max-w-md mx-auto leading-relaxed mb-8">
            You must have a registered and verified business profile in the Aba City Registry to access Merchant tools.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setView('register')}
              className="flex items-center gap-2 px-6 py-3 bg-aba-green text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-aba-green/90 transition-all active:scale-95"
            >
              <Plus size={16} /> Register Business
            </button>
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              <ArrowLeft size={16} /> Return to City Hub
            </button>
          </div>
        </div>
      );
    }

    // Default unauthorized (requires sign in)
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold mb-6 shadow-2xl">
          <Lock size={36} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
          Authentication Required
        </h2>
        <p className="text-white/50 text-xs max-w-md mx-auto leading-relaxed mb-8">
          Please sign in to your FindAba account to continue to this section.
        </p>
        <button
          onClick={() => setView('login')}
          className="flex items-center gap-2 px-8 py-3.5 bg-aba-gold text-aba-deep rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-aba-gold/90 transition-all active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

