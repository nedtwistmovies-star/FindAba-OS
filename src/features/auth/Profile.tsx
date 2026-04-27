import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, ChevronRight, Store, Building2, Truck, Globe, Headphones, Terminal, 
  HelpCircle, ShieldCheck, Wallet, Settings, MapPin, Briefcase, Landmark, Shield, 
  LogOut, Key, Zap, CheckCircle2, AlertTriangle, ExternalLink, Car, Activity,
  LayoutGrid, UserCheck, BarChart3, ImageIcon, Video, RefreshCcw, Database, Trash2, Copy, Ticket
} from 'lucide-react';
import { ViewState, PlatformConfig, Business, Profile as UserProfileType } from '../../types';
import { paymentService } from '../../services/paymentService';
import { 
  authSignOut, fetchPlatformConfig, updatePlatformConfig, fetchAllBusinesses, 
  getSupabase, checkDatabaseHealth, reconnectRegistry, getRegistryConfig, purgeLocalRegistry,
  fetchUserProfile 
} from '../../services/supabaseService';
import IndustrialButton from '../../components/IndustrialButton';
import SectionHeader from '../../components/SectionHeader';
import StatCard from '../../components/StatCard';
import { BentoGrid } from '../../components/BentoGrid';
import { ImageUpload, MultiImageUpload } from '../../components/ImageUpload';
import { MultiVideoUpload } from '../../components/VideoUpload';
import { useToast } from '../../providers/ToastProvider';

const Profile: React.FC<{ setView: (v: ViewState) => void; userEmail: string; userRole: string | null; myBusiness?: any }> = ({ setView, userEmail, userRole, myBusiness }) => {
  const isAuth = localStorage.getItem('findaba_is_auth') === 'true';
  const isAdmin = userRole === 'admin' || localStorage.getItem('findaba_admin_auth') === 'true';
  
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'verification' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [dbHealth, setDbHealth] = useState<{ status: 'healthy' | 'unhealthy' | 'unknown', message?: string }>({ status: 'unknown' });
  const [dbConfig, setDbConfig] = useState(getRegistryConfig());
  const [profile, setProfile] = useState<UserProfileType | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const config = await fetchPlatformConfig();
      setPlatformConfig(config);
      
      const biz = await fetchAllBusinesses();
      setBusinesses(biz);

      const health = await checkDatabaseHealth();
      setDbHealth(health);

      const userId = localStorage.getItem('findaba_user_id');
      if (userId) {
        const p = await fetchUserProfile(userId);
        setProfile(p);
      }
    } catch (err) {
      console.error("Profile Sync Fault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogout = async () => {
    if (!confirm("Terminate secure industrial session?")) return;
    await authSignOut();
    localStorage.removeItem('findaba_is_auth');
    localStorage.removeItem('findaba_user_id');
    localStorage.removeItem('findaba_user_name');
    localStorage.removeItem('findaba_user_email');
    localStorage.removeItem('findaba_user_role');
    window.location.reload();
  };

  const handleDbReconnect = async () => {
    setLoading(true);
    const client = reconnectRegistry(dbConfig.url, dbConfig.key);
    if (client) {
      const health = await checkDatabaseHealth(dbConfig.url, dbConfig.key);
      setDbHealth(health);
      if (health.status === 'healthy') refreshData();
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-[#020617] animate-fade-in flex flex-col">
      {/* HEADER SECTION */}
      <div className="bg-black/40 backdrop-blur-2xl p-5 sm:p-10 pb-10 sm:pb-16 rounded-b-[2rem] sm:rounded-b-[4rem] shadow-2xl relative overflow-hidden border-b border-white/5 shrink-0">
        <div className="absolute inset-0 opacity-10 industrial-grid pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-aba-gold/5 rounded-full -mr-48 -mt-48 blur-[120px]" />
        
        <div className="relative z-10 flex items-center justify-between pt-6 sm:pt-12">
          <div className="flex items-center gap-3 sm:gap-8">
            <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-xl sm:rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden text-aba-gold group">
               <div className="absolute inset-0 bg-aba-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <User size={28} className="sm:size-[48px] relative z-10" />
            </div>
            <div className="text-white min-w-0">
              <h2 className="text-xl sm:text-4xl font-black uppercase tracking-tighter leading-none truncate">{isAuth ? 'Verified Partner' : 'Guest Citizen'}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-3">
                <p className="text-aba-gold text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] opacity-60 truncate max-w-[120px] sm:max-w-none">{userEmail?.toUpperCase() || 'ANONYMOUS'}</p>
                {userRole && (
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-aba-gold/10 border border-aba-gold/20 rounded-lg text-[7px] sm:text-[8px] font-black uppercase text-aba-gold tracking-widest">
                    {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={refreshData}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:text-aba-gold transition-all active:scale-90"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <nav className="flex bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0 px-2 sm:px-6 touch-pan-x whitespace-nowrap">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={12} className="sm:size-[16px]" /> },
          { id: 'identity', label: 'Identity', icon: <UserCheck size={12} className="sm:size-[16px]" /> },
          { id: 'verification', label: 'Verification', icon: <ShieldCheck size={12} className="sm:size-[16px]" /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={12} className="sm:size-[16px]" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-3 transition-all border-b-2 shrink-0 ${activeTab === tab.id ? 'border-aba-gold text-aba-gold bg-white/5' : 'border-transparent text-white/40 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* TAB CONTENT */}
      <div className="flex-1 px-3 sm:px-8 pt-6">
        <div className="max-w-4xl mx-auto space-y-6 sm:y-12 pb-48 md:pb-32">
          
          {activeTab === 'overview' && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader title="Industrial Overview" icon={Activity} />
              
              <BentoGrid>
                <StatCard 
                  title="Registry Status" 
                  value={dbHealth.status === 'healthy' ? 'Online' : 'Offline'} 
                  icon={Database} 
                  color={dbHealth.status === 'healthy' ? 'text-aba-green' : 'text-red-500'}
                />
                <StatCard 
                  title="Partner Identity" 
                  value={isAuth ? 'Verified' : 'Guest'} 
                  icon={ShieldCheck} 
                  color="text-aba-gold"
                />
                <StatCard 
                  title="Referral Earnings" 
                  value={`₦${profile?.referral_earnings || 0}`} 
                  icon={Wallet} 
                  color="text-aba-green"
                />
                <StatCard 
                  title="Total Referrals" 
                  value={profile?.referral_count || 0} 
                  icon={UserCheck} 
                  color="text-aba-gold"
                />
              </BentoGrid>

              {isAuth && profile && (
                <div className="bg-[#01301c] p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-aba-gold/20 space-y-6 sm:space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Ticket size={120} className="rotate-12" />
                    </div>
                    
                    <div className="relative z-10">
                      <SectionHeader 
                        title="Referral Protocol" 
                        subtitle="Invite partners and earn rewards"
                        icon={Ticket} 
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mt-6 sm:mt-10">
                        <div className="space-y-3 sm:space-y-4">
                          <p className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Referral Code</p>
                          <div className="flex items-center gap-4 bg-black/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 group/code hover:border-aba-gold/40 transition-all">
                            <span className="text-xl sm:text-2xl font-black tracking-tighter text-aba-gold uppercase">{profile.referral_code}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(profile.referral_code);
                                addToast("Referral code copied", 'success');
                              }}
                              className="ml-auto p-2 sm:p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <p className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Referral Link</p>
                          <div className="flex items-center gap-4 bg-black/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 group/code hover:border-aba-gold/40 transition-all">
                            <span className="text-[10px] font-mono text-white/60 truncate flex-1">findaba.com.ng/signup?ref={profile.referral_code}</span>
                            <button 
                              onClick={() => {
                                const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
                                navigator.clipboard.writeText(link);
                                addToast("Link copied", 'success');
                              }}
                              className="ml-auto p-2 sm:p-3 bg-white/5 rounded-xl hover:text-aba-gold transition-colors"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              <div className="space-y-4">
                <SectionHeader title="Active Partners" icon={Zap} />
                
                {myBusiness && (
                  <button 
                    onClick={() => setView('merchant-portal')}
                    className="w-full bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/10 flex items-center justify-between group transition-all active:scale-[0.98] hover:border-aba-gold/30"
                  >
                     <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-aba-gold rounded-2xl sm:rounded-3xl flex items-center justify-center text-aba-dark shadow-2xl group-hover:scale-110 transition-transform">
                           <Store size={24} className="sm:size-[32px]" />
                        </div>
                        <div className="text-left">
                           <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-none group-hover:text-aba-gold transition-colors">Merchant Portal</h4>
                           <p className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-[0.3em] sm:tracking-[0.5em] mt-1.5 sm:mt-2">Manage {myBusiness.name} Partner</p>
                        </div>
                     </div>
                     <ChevronRight size={20} className="text-aba-gold group-hover:translate-x-1 transition-transform sm:size-[24px]" />
                  </button>
                )}
                
                {!isAuth && (
                  <button 
                    onClick={() => setView('login')}
                    className="w-full bg-[#002113] p-8 rounded-[3rem] shadow-2xl border border-white/5 flex items-center justify-between group transition-all active:scale-[0.98] hover:border-aba-gold/30"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                           <Shield size={32} />
                        </div>
                        <div className="text-left">
                           <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none">Registry User Auth</h4>
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.5em] mt-2">Establish Personal Partner ID</p>
                        </div>
                     </div>
                     <ChevronRight size={24} className="text-white/20 group-hover:text-aba-gold transition-all group-hover:translate-x-1" />
                  </button>
                )}

                <button 
                  onClick={() => setView('hardware-audit')}
                  className="w-full bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/10 flex items-center justify-between group transition-all active:scale-[0.98] hover:border-aba-gold/30"
                >
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-aba-gold shadow-2xl group-hover:scale-110 transition-transform">
                        <Terminal size={32} />
                      </div>
                      <div className="text-left">
                         <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none group-hover:text-aba-gold transition-colors">Hardware Audit</h4>
                         <p className="text-[9px] font-black text-aba-gold/60 uppercase tracking-[0.5em] mt-2">Analyze Migration Specs</p>
                      </div>
                   </div>
                   <ChevronRight size={24} className="text-white/20 group-hover:text-aba-gold transition-all group-hover:translate-x-1" />
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => setView('admin')}
                    className="w-full bg-aba-gold/10 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-aba-gold/20 flex items-center justify-between group transition-all active:scale-[0.98] hover:border-aba-gold/40"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-aba-gold rounded-3xl flex items-center justify-center text-aba-dark shadow-2xl group-hover:scale-110 transition-transform">
                          <Settings size={32} />
                        </div>
                        <div className="text-left">
                           <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none group-hover:text-aba-gold transition-colors">Admin Console</h4>
                           <p className="text-[9px] font-black text-aba-gold/60 uppercase tracking-[0.5em] mt-2">System Override & Config</p>
                        </div>
                     </div>
                     <ChevronRight size={24} className="text-aba-gold group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Platform Identity" 
                subtitle="Configure visual assets and social node connections"
                icon={UserCheck}
              />
              
              {platformConfig ? (
                <div className="space-y-12">
                  <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-10">
                    <SectionHeader title="Visual Identity" icon={ImageIcon} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <ImageUpload
                        label="Platform Logo"
                        currentImage={platformConfig.app_logo}
                        onUpload={(url: string) => updatePlatformConfig({ app_logo: url }).then(refreshData)}
                      />
                      <ImageUpload
                        label="Oracle Avatar (FindAba AI)"
                        currentImage={platformConfig.oracle_avatar}
                        onUpload={(url: string) => updatePlatformConfig({ oracle_avatar: url }).then(refreshData)}
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-10">
                    <SectionHeader title="Social Partners" icon={Globe} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['facebook_url', 'instagram_url', 'twitter_url', 'tiktok_url'].map((field) => (
                        <div key={field} className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/60 tracking-widest ml-4">
                            {field.replace('_url', '').toUpperCase()} URL
                          </label>
                          <input
                            type="text"
                            value={(platformConfig as any)[field] || ""}
                            onChange={(e) => updatePlatformConfig({ [field]: e.target.value }).then(refreshData)}
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs text-white placeholder:text-white/20"
                            placeholder={`https://${field.replace('_url', '')}.com/findaba`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-10">
                    <SectionHeader title="Hero Images Registry" icon={ImageIcon} />
                    <MultiImageUpload 
                      label="App Hero Images" 
                      urls={platformConfig.hero_images || []}
                      onAdd={async (url: string) => {
                        const newImages = [...(platformConfig.hero_images || []), url];
                        await updatePlatformConfig({ hero_images: newImages });
                        await refreshData();
                      }}
                      onRemove={async (idx: number) => {
                        const newImages = (platformConfig.hero_images || []).filter((_, i) => i !== idx);
                        await updatePlatformConfig({ hero_images: newImages });
                        await refreshData();
                      }}
                    />
                  </div>

                  <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-10">
                    <SectionHeader title="Hero Videos Registry" icon={Video} />
                    <MultiVideoUpload 
                      label="App Hero Videos"
                      videos={platformConfig.hero_videos || []}
                      onAdd={async (url: string, idx: number) => {
                        const current = [...(platformConfig.hero_videos || [])];
                        if (idx === -1) current.push({ url, caption: 'New Sequence' });
                        else current[idx].url = url;
                        await updatePlatformConfig({ hero_videos: current });
                        await refreshData();
                      }}
                      onRemove={async (idx: number) => {
                        const current = (platformConfig.hero_videos || []).filter((_, i) => i !== idx);
                        await updatePlatformConfig({ hero_videos: current });
                        await refreshData();
                      }}
                      onUpdateCaption={async (cap: string, idx: number) => {
                        const current = [...(platformConfig.hero_videos || [])];
                        current[idx].caption = cap;
                        await updatePlatformConfig({ hero_videos: current });
                        await refreshData();
                      }}
                      onMove={async (from: number, to: number) => {
                        const current = [...(platformConfig.hero_videos || [])];
                        const [moved] = current.splice(from, 1);
                        current.splice(to, 0, moved);
                        await updatePlatformConfig({ hero_videos: current });
                        await refreshData();
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center opacity-40 italic bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  Registry Identity Partner Not Initialized.
                </div>
              )}
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Verification Bureau" 
                subtitle="Review Artisan Credentials"
                icon={ShieldCheck}
              />
              
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                {businesses.filter(b => b.verification_status === 'Pending' || b.status === 'pending').length === 0 ? (
                  <div className="p-20 text-center opacity-30">
                    <Shield size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">No pending verifications in queue.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {businesses.filter(b => b.verification_status === 'Pending' || b.status === 'pending').map(b => (
                      <div key={b.id} className="flex items-center justify-between p-6 bg-black/20 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-6">
                          <img src={b.image_url} className="w-16 h-16 rounded-2xl object-cover" />
                          <div>
                            <h5 className="text-lg font-black uppercase">{b.name}</h5>
                            <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest">{b.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <IndustrialButton variant="primary" size="sm" onClick={() => {/* Approve logic */}}>Approve</IndustrialButton>
                          <IndustrialButton variant="danger" size="sm" onClick={() => {/* Reject logic */}}>Reject</IndustrialButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader title="System Settings" icon={Settings} />
              
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-10">
                <SectionHeader title="Registry Connection" icon={Database} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/60 tracking-widest ml-4">Supabase URL</label>
                    <input
                      type="text"
                      value={dbConfig.url}
                      onChange={(e) => setDbConfig({ ...dbConfig, url: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all font-mono text-[10px] text-white placeholder:text-white/20"
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/60 tracking-widest ml-4">Anon Key</label>
                    <input
                      type="password"
                      value={dbConfig.key}
                      onChange={(e) => setDbConfig({ ...dbConfig, key: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all font-mono text-[10px] text-white placeholder:text-white/20"
                      placeholder="your-anon-key"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <IndustrialButton variant="primary" size="md" icon={RefreshCcw} onClick={handleDbReconnect} fullWidth>
                    Reconnect Signal
                  </IndustrialButton>
                  <IndustrialButton variant="danger" size="md" icon={Trash2} onClick={() => { purgeLocalRegistry(); setDbConfig({url:'', key:''}); }} fullWidth>
                    Purge Local Partner
                  </IndustrialButton>
                </div>
              </div>

              {isAuth && (
                <IndustrialButton
                  variant="danger"
                  size="lg"
                  icon={LogOut}
                  onClick={handleLogout}
                  fullWidth
                  className="mt-12"
                >
                  TERMINATE HANDSHAKE
                </IndustrialButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
