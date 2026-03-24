import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Loader2,
  RefreshCcw,
  ArrowLeft,
  Activity,
  AlertTriangle,
  Database,
  Sparkles,
  ImageIcon,
  Video,
  Zap,
  Landmark,
  CreditCard,
  LayoutGrid,
  Settings,
  Key,
  UserCheck,
  Terminal,
  Cloud,
  Globe,
  Copy,
  Check,
  Info,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Github,
} from "lucide-react";
import {
  fetchPlatformConfig,
  updatePlatformConfig,
  fetchAllBusinesses,
  getSupabase,
  fetchBuyerSignals,
  getRegistryConfig,
  reconnectRegistry,
  checkDatabaseHealth,
  purgeLocalRegistry,
  seedDatabase,
} from "../../services/supabaseService";
import { ARTISANS } from "../../constants";
import { useToast } from "../../providers/ToastProvider";
import { triggerWebhook, WebhookEvent } from "../../services/webhookService";
import { paymentService } from "../../services/paymentService";
import { PlatformConfig, Business, BuyerSignal, LedgerEntry } from "../../types";
import { ImageUpload, MultiImageUpload } from "../../components/ImageUpload";
import { MultiVideoUpload } from "../../components/VideoUpload";
import StatCard from "../../components/StatCard";
import SectionHeader from "../../components/SectionHeader";
import IndustrialButton from "../../components/IndustrialButton";
import { BentoGrid, BentoItem } from "../../components/BentoGrid";
import { GitHubSync } from "../../components/GitHubSync";

const Admin: React.FC<any> = ({ setView, userRole, userEmail }) => {
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const pinAuth = localStorage.getItem("findaba_admin_auth") === "true";
    return pinAuth || userRole === "admin";
  });
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "registry"
    | "signals"
    | "identity"
    | "settlement"
    | "supabase"
    | "verification"
    | "users"
  >("overview");
  const [loading, setLoading] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(
    null,
  );
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [signals, setSignals] = useState<BuyerSignal[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Supabase Config State
  const [dbConfig, setDbConfig] = useState(getRegistryConfig());
  const [dbHealth, setDbHealth] = useState<{
    status: "healthy" | "unhealthy" | "unknown";
    message?: string;
  }>({ status: "unknown" });

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const config = await fetchPlatformConfig();
      setPlatformConfig(config);

      const biz = await fetchAllBusinesses();
      setBusinesses(biz);

      const sigs = await fetchBuyerSignals();
      setSignals(sigs);

      const health = await checkDatabaseHealth();
      setDbHealth(health);

      const sb = getSupabase();
      if (sb) {
        const { data: ledgerData } = await sb.from('ledger').select('*').order('created_at', { ascending: false });
        setLedger(ledgerData || []);

        const { data: profileData } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
        setProfiles(profileData || []);
      }
    } catch (err) {
      console.error("Registry Sync Fault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshAllData();
  }, [isAuthenticated, refreshAllData]);

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit !== "" && index < 3) pinRefs[index + 1].current?.focus();
    if (newPin.join("") === "1234") {
      localStorage.setItem("findaba_admin_auth", "true");
      setIsAuthenticated(true);
    }
  };

  const handleDbReconnect = async () => {
    setLoading(true);
    const client = reconnectRegistry(dbConfig.url, dbConfig.key);
    if (client) {
      const health = await checkDatabaseHealth(dbConfig.url, dbConfig.key);
      setDbHealth(health);
      if (health.status === "healthy") refreshAllData();
    }
    setLoading(false);
  };

  if (!isAuthenticated)
    return (
      <div className="fixed inset-0 z-[6000] bg-[#020617] flex flex-col items-center justify-center p-8 font-sans text-white">
        <Shield
          size={64}
          className="text-aba-gold mb-10 animate-pulse-subtle"
        />
        <h3 className="text-3xl font-black uppercase text-white tracking-tighter mb-12">
          Command Console
        </h3>
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={pinRefs[i]}
              type="tel"
              maxLength={1}
              value={pin[i]}
              autoFocus={i === 0}
              onChange={(e) => handlePinChange(i, e.target.value)}
              className="w-16 h-24 rounded-2xl border-2 text-center text-4xl font-black bg-white/5 text-white outline-none border-white/10 focus:border-aba-gold transition-all"
            />
          ))}
        </div>
        <p className="mt-12 text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">
          Institutional PIN Required
        </p>

        {userRole !== "admin" && (
          <div className="mt-20 p-8 bg-white/5 border border-white/10 rounded-[2rem] max-w-md text-center">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
              To gain permanent admin access without a PIN, run this SQL in your
              Supabase Editor:
            </p>
            <div className="mt-6 p-4 bg-black rounded-xl border border-white/5 font-mono text-[10px] text-aba-gold/80 break-all">
              UPDATE profiles SET role = 'admin' WHERE email = '
              {userEmail || "your-email@example.com"}';
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div className="flex-1 bg-[#020617] flex flex-col text-white animate-fade-in font-sans h-full overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-8 flex justify-between items-center bg-black/40 backdrop-blur-2xl border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setView("profile")}
            className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
            System Console
          </h3>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border flex items-center gap-2 ${dbHealth.status === "healthy" ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
          >
            <div
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${dbHealth.status === "healthy" ? "bg-aba-green animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
              {dbHealth.status === "healthy"
                ? "Registry Online"
                : "Registry Offline"}
            </span>
          </div>
          <button
            onClick={refreshAllData}
            className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-white/10 hover:text-aba-gold transition-colors"
          >
            <RefreshCcw
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      <nav className="flex bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
          { id: "identity", label: "Identity", icon: <UserCheck size={16} /> },
          {
            id: "verification",
            label: "Verification",
            icon: <Shield size={16} />,
          },
          { id: "registry", label: "Artisans", icon: <LayoutGrid size={16} /> },
          { id: "signals", label: "Signals", icon: <Zap size={16} /> },
          { id: "settlement", label: "Settlement", icon: <Landmark size={16} /> },
          { id: "users", label: "Users", icon: <Users size={16} /> },
          {
            id: "supabase",
            label: "Signal Registry",
            icon: <Database size={16} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all border-b-2 shrink-0 ${activeTab === tab.id ? "border-aba-gold text-aba-gold bg-white/5" : "border-transparent text-white/40 hover:text-white"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
        <div className="max-w-7xl mx-auto pb-40">
          {activeTab === "overview" && (
            <div className="animate-slide-up space-y-12">
              <SectionHeader 
                title="Industrial Overview" 
                subtitle="Real-time platform metrics and node status"
                icon={Activity}
              />
              
              <BentoGrid>
                <StatCard 
                  title="Total Artisans" 
                  value={businesses.length} 
                  icon={Users} 
                  trend={{ value: "12%", isPositive: true }}
                  description="Verified nodes in the industrial registry"
                />
                <StatCard 
                  title="Buyer Signals" 
                  value={signals.length} 
                  icon={Zap} 
                  trend={{ value: "8%", isPositive: true }}
                  description="Active procurement requests from global buyers"
                  color="text-aba-green"
                />
                <StatCard 
                  title="Total Revenue" 
                  value={`₦${ledger.reduce((acc, curr) => acc + curr.gross_amount, 0).toLocaleString()}`} 
                  icon={Landmark} 
                  description="Gross volume processed through the platform"
                  color="text-aba-gold"
                />
                <StatCard 
                  title="Pending Audits" 
                  value={businesses.filter(b => b.verification_status === 'Pending' || b.status === 'pending').length} 
                  icon={Shield} 
                  description="Artisans awaiting institutional verification"
                  color="text-aba-red"
                />
              </BentoGrid>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Activity className="text-aba-gold" /> System Health
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Registry Signal</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${dbHealth.status === 'healthy' ? 'text-aba-green' : 'text-red-500'}`}>
                        {dbHealth.status === 'healthy' ? 'Optimal' : 'Fault Detected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Storage Node</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-aba-green">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">AI Oracle (Elder Kalu)</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-aba-gold">Synchronized</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                  <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                    <Github className="text-aba-gold" /> Code Synchronization
                  </h4>
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-widest">
                      Synchronize your local development environment with your GitHub repository.
                    </p>
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <GitHubSync />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                  <TrendingUp className="text-aba-gold" /> Quick Actions
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <IndustrialButton variant="secondary" size="md" icon={RefreshCcw} onClick={refreshAllData} fullWidth>
                    Sync Registry
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Zap} onClick={() => setActiveTab('signals')} fullWidth>
                    View Signals
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Shield} onClick={() => setActiveTab('verification')} fullWidth>
                    Audit Queue
                  </IndustrialButton>
                  <IndustrialButton variant="secondary" size="md" icon={Settings} onClick={() => setActiveTab('supabase')} fullWidth>
                    Node Config
                  </IndustrialButton>
                </div>
              </div>
            </div>
          )}
          {activeTab === "identity" && (
            <div className="animate-slide-up space-y-6 sm:space-y-12">
              <SectionHeader 
                title="Platform Identity" 
                subtitle="Configure visual assets and social node connections"
                icon={UserCheck}
              />
              {platformConfig ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5">
                    <SectionHeader title="Visual Identity" icon={ImageIcon} className="mb-6" />
                    <div className="space-y-8">
                      <ImageUpload
                        label="Platform Logo"
                        currentImage={platformConfig.app_logo}
                        onUpload={(url: string) =>
                          updatePlatformConfig({ app_logo: url }).then(
                            refreshAllData,
                          )
                        }
                      />
                      <ImageUpload
                        label="Oracle Avatar (Elder Kalu)"
                        currentImage={platformConfig.oracle_avatar}
                        onUpload={(url: string) =>
                          updatePlatformConfig({ oracle_avatar: url }).then(
                            refreshAllData,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5">
                    <SectionHeader title="Social Nodes" icon={Globe} className="mb-6" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Facebook URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.facebook_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              facebook_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://facebook.com/findaba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Instagram URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.instagram_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              instagram_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://instagram.com/find_aba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          Twitter URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.twitter_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              twitter_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://twitter.com/find_aba"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                          TikTok URL
                        </label>
                        <input
                          type="text"
                          value={platformConfig.tiktok_url || ""}
                          onChange={(e) =>
                            updatePlatformConfig({
                              tiktok_url: e.target.value,
                            }).then(refreshAllData)
                          }
                          className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-aba-gold transition-all text-xs"
                          placeholder="https://tiktok.com/@find_aba"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 sm:space-y-10 bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5 lg:col-span-2">
                    <SectionHeader title="Hero Assets" icon={Video} className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
                      <MultiImageUpload
                        label="Hero Carousel Stills"
                        urls={platformConfig.hero_images || []}
                        onAdd={async (url: string) => {
                          const newImages = [
                            ...(platformConfig.hero_images || []),
                            url,
                          ];
                          await updatePlatformConfig({ hero_images: newImages });
                          await refreshAllData();
                        }}
                        onRemove={async (idx: number) => {
                          const newImages = (
                            platformConfig.hero_images || []
                          ).filter((_, i) => i !== idx);
                          await updatePlatformConfig({ hero_images: newImages });
                          await refreshAllData();
                        }}
                      />
                      <MultiVideoUpload
                        label="Hero Carousel Videos"
                        videos={platformConfig.hero_videos || []}
                        onAdd={async (url: string, idx: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          if (idx === -1) {
                            newVideos.push({ url, caption: "New Sequence" });
                          } else {
                            newVideos[idx] = { ...newVideos[idx], url };
                          }
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onRemove={async (idx: number) => {
                          const newVideos = (
                            platformConfig.hero_videos || []
                          ).filter((_, i) => i !== idx);
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onUpdateCaption={async (caption: string, idx: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          newVideos[idx] = { ...newVideos[idx], caption };
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                        onMove={async (from: number, to: number) => {
                          const newVideos = [
                            ...(platformConfig.hero_videos || []),
                          ];
                          const [moved] = newVideos.splice(from, 1);
                          newVideos.splice(to, 0, moved);
                          await updatePlatformConfig({ hero_videos: newVideos });
                          await refreshAllData();
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center opacity-40 italic">
                  Registry Identity Node Not Initialized.
                </div>
              )}
            </div>
          )}

          {activeTab === "supabase" && (
            <div className="animate-slide-up space-y-6 sm:space-y-12">
              <SectionHeader 
                title="Signal Registry Config" 
                subtitle="Configure your Supabase Industrial Node"
                icon={Database}
                action={
                  <div className="flex gap-4">
                    <IndustrialButton 
                      variant="secondary" 
                      size="sm" 
                      icon={Sparkles} 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await seedDatabase(ARTISANS);
                          await refreshAllData();
                          addToast("Industrial Registry Seeded Successfully!", "success");
                        } catch (err) {
                          addToast("Seeding Failed", "error");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Seed Registry
                    </IndustrialButton>
                    <IndustrialButton 
                      variant="secondary" 
                      size="sm" 
                      icon={Zap} 
                      onClick={async () => {
                        const success = await triggerWebhook(
                          WebhookEvent.PAYMENT_SUCCESS,
                          {
                            test: true,
                            message: "Manual Signal Test from Admin Console",
                          },
                        );
                        if (success)
                          addToast("Webhook Signal Dispatched Successfully!", "success");
                        else
                          addToast(
                            "Webhook Fault: Check VITE_MAKE_WEBHOOK_URL in environment.",
                            "error"
                          );
                      }}
                    >
                      Test Webhook
                    </IndustrialButton>
                    <IndustrialButton 
                      variant="danger" 
                      size="sm" 
                      icon={Trash2} 
                      onClick={() => {
                        purgeLocalRegistry();
                        setDbConfig({ url: "", key: "" });
                      }}
                    >
                      Purge
                    </IndustrialButton>
                  </div>
                }
              />
              <div className="bg-white/5 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={dbConfig.url}
                      onChange={(e) =>
                        setDbConfig({ ...dbConfig, url: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-[11px] sm:text-xs"
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">
                      Anon Public Key
                    </label>
                    <input
                      type="password"
                      value={dbConfig.key}
                      onChange={(e) =>
                        setDbConfig({ ...dbConfig, key: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-[11px] sm:text-xs"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <IndustrialButton 
                    variant="primary" 
                    size="lg" 
                    icon={RefreshCcw} 
                    loading={loading}
                    onClick={handleDbReconnect}
                    fullWidth
                  >
                    Establish Handshake
                  </IndustrialButton>
                  <IndustrialButton 
                    variant="secondary" 
                    size="lg" 
                    icon={Copy} 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("sb_url", dbConfig.url);
                      params.set("sb_key", dbConfig.key);
                      const syncUrl = `${window.location.origin}?${params.toString()}`;
                      navigator.clipboard.writeText(syncUrl);
                      addToast(
                        "Signal Sync Link Copied! Open this link on your other device to initialize the signal.",
                        "success"
                      );
                    }}
                    fullWidth
                  >
                    Generate Sync Link
                  </IndustrialButton>
                </div>

                {dbHealth.message && (
                  <div
                    className={`p-6 rounded-3xl border flex items-start gap-4 ${dbHealth.status === "healthy" ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
                  >
                    <AlertTriangle size={20} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose">
                      {dbHealth.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/40 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-8">
                <SectionHeader 
                  title="Storage Registry Setup" 
                  icon={Cloud} 
                  className="mb-6"
                  action={
                    <IndustrialButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => {
                        const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('findaba', 'findaba', true) ON CONFLICT (id) DO NOTHING;\n\nCREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'findaba');\nCREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'findaba');\nCREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'findaba');\nCREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'findaba');`;
                        navigator.clipboard.writeText(sql);
                        addToast("Storage SQL Copied", "success");
                      }}
                    >
                      Copy Storage SQL
                    </IndustrialButton>
                  }
                />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                  If you see "Bucket not found" errors, run the copied SQL in
                  your Supabase Editor to initialize the 'findaba' bucket and
                  set public permissions.
                </p>
              </div>

              <div className="bg-black/40 p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border border-white/5 space-y-6 sm:space-y-8">
                <SectionHeader 
                  title="Master SQL Schema" 
                  icon={Terminal} 
                  className="mb-6"
                  action={
                    <IndustrialButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={async () => {
                        try {
                          const response = await fetch('/SUPABASE_SCHEMA.sql');
                          const sql = await response.text();
                          navigator.clipboard.writeText(sql);
                          addToast("Master SQL Schema Copied! Run this in your Supabase SQL Editor.", "success");
                        } catch (err) {
                          addToast("Failed to load schema file. Check root directory.", "error");
                        }
                      }}
                    >
                      Copy Master SQL
                    </IndustrialButton>
                  }
                />
                <div className="bg-black p-8 rounded-3xl border border-white/5 font-mono text-[10px] text-aba-green/60 leading-relaxed overflow-x-auto">
                  <pre>-- SEE SUPABASE_SCHEMA.sql IN ROOT DIRECTORY --</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Verification Bureau" 
                subtitle="Review Artisan Credentials"
                icon={Shield}
              />

              <div className="grid grid-cols-1 gap-6">
                {businesses.filter(
                  (b) =>
                    b.verification_status === "Pending" ||
                    b.status === "pending",
                ).length === 0 ? (
                  <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                    <Shield size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">
                      No pending verifications in queue.
                    </p>
                  </div>
                ) : (
                  businesses
                    .filter(
                      (b) =>
                        b.verification_status === "Pending" ||
                        b.status === "pending",
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={b.image_url}
                              className="w-full h-full object-cover"
                              alt={b.name}
                            />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-xl font-black uppercase tracking-tight">
                              {b.name}
                            </h5>
                            <p className="text-[10px] font-bold text-aba-gold uppercase tracking-widest">
                              {b.category} • {b.area}
                            </p>
                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                              {b.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <IndustrialButton 
                            variant="primary" 
                            size="md" 
                            onClick={async () => {
                              const client = getSupabase();
                              if (client) {
                                const { error } = await client
                                  .from("businesses")
                                  .update({
                                    verification_status: "Verified",
                                    is_verified: true,
                                    status: "active",
                                    verification_level: "Silver",
                                  })
                                  .eq("id", b.id);
                                
                                if (error) addToast("Approval Fault: " + error.message, "error");
                                else {
                                  addToast(`${b.name} Approved`, "success");
                                  refreshAllData();
                                }
                              }
                            }}
                          >
                            Approve
                          </IndustrialButton>
                          <IndustrialButton 
                            variant="danger" 
                            size="md" 
                            onClick={async () => {
                              const client = getSupabase();
                              if (client) {
                                const { error } = await client
                                  .from("businesses")
                                  .update({
                                    verification_status: "Rejected",
                                    status: "rejected",
                                  })
                                  .eq("id", b.id);
                                
                                if (error) addToast("Rejection Fault: " + error.message, "error");
                                else {
                                  addToast(`${b.name} Rejected`, "info");
                                  refreshAllData();
                                }
                              }
                            }}
                          >
                            Reject
                          </IndustrialButton>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === "settlement" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Financial Settlement" 
                subtitle={`Managing ${ledger.length} ledger entries`}
                icon={Landmark}
              />

              {/* Paystack Node Config */}
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                      <CreditCard className="text-aba-gold" /> Paystack Node
                    </h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Configure Industrial Settlement Gateway</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${paymentService.hasKey() ? "bg-aba-green/10 border-aba-green/20 text-aba-green" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${paymentService.hasKey() ? "bg-aba-green animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {paymentService.hasKey() ? (paymentService.isLive() ? "Live Mode" : "Test Mode") : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Paystack Public Key</label>
                    <div className="flex gap-4">
                      <input
                        type="password"
                        defaultValue={paymentService.getApiKey()}
                        placeholder="pk_live_... or pk_test_..."
                        className="flex-1 bg-black/40 border border-white/10 p-6 rounded-3xl outline-none focus:border-aba-gold transition-all font-mono text-xs"
                        onBlur={(e) => {
                          if (e.target.value) {
                            const success = paymentService.setApiKey(e.target.value);
                            if (success) {
                              addToast("Paystack Node Synchronized", "success");
                              refreshAllData();
                            } else {
                              addToast("Invalid Key Format. Must start with pk_live_ or pk_test_", "error");
                            }
                          }
                        }}
                      />
                      <IndustrialButton 
                        variant="secondary" 
                        size="md" 
                        icon={Trash2}
                        onClick={() => {
                          localStorage.removeItem('findaba_paystack_public_key');
                          addToast("Paystack Node Purged", "info");
                          refreshAllData();
                        }}
                      >
                        Purge
                      </IndustrialButton>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                    <Info size={20} className="text-blue-400 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Webhook Configuration</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">
                        Set your Paystack Webhook URL to: <span className="text-white font-mono lowercase">{paymentService.getWebhookUrl()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Reference</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Gross</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Platform</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Merchant</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center opacity-30 italic text-xs">No ledger entries found.</td>
                      </tr>
                    ) : (
                      ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">
                              {entry.booking_id ? `BK-${entry.booking_id.slice(0,8)}` : `ORD-${entry.order_id?.slice(0,8)}`}
                            </p>
                            <p className="text-[8px] font-bold text-white/20 uppercase mt-1">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="p-6 text-xs font-black text-white">₦{entry.gross_amount.toLocaleString()}</td>
                          <td className="p-6 text-xs font-black text-aba-gold">₦{entry.sandalsroyalle_share.toLocaleString()}</td>
                          <td className="p-6 text-xs font-black text-aba-green">₦{(entry.merchant_share || entry.hotel_share).toLocaleString()}</td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${entry.settlement_status === 'paid' ? 'bg-aba-green/20 text-aba-green' : 'bg-aba-gold/20 text-aba-gold'}`}>
                              {entry.settlement_status}
                            </span>
                          </td>
                          <td className="p-6">
                            {entry.settlement_status === 'pending' && (
                              <button 
                                onClick={async () => {
                                  const sb = getSupabase();
                                  if (sb) {
                                    await sb.from('ledger').update({ settlement_status: 'paid' }).eq('id', entry.id);
                                    refreshAllData();
                                  }
                                }}
                                className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-aba-gold transition-all"
                              >
                                <Check size={14} className="text-aba-gold" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="User Management" 
                subtitle={`Managing ${profiles.length} platform nodes`}
                icon={Users}
              />
              <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">User Node</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Joined</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                              <Users size={16} className="text-white/40" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-tight">{profile.full_name || 'Anonymous Node'}</p>
                              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${profile.role === 'admin' ? 'bg-aba-gold text-aba-dark' : 'bg-white/10 text-white/60'}`}>
                            {profile.role || 'registered'}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const newRole = profile.role === 'admin' ? 'registered' : 'admin';
                                const sb = getSupabase();
                                if (sb) {
                                  await sb.from('profiles').update({ role: newRole }).eq('id', profile.id);
                                  refreshAllData();
                                }
                              }}
                              className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-aba-gold transition-all"
                              title="Toggle Admin Role"
                            >
                              <Shield size={14} className={profile.role === 'admin' ? 'text-aba-gold' : 'text-white/40'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "registry" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Artisan Registry" 
                subtitle={`Managing ${businesses.length} industrial nodes`}
                icon={Database}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white/5 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-aba-gold/30 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={b.image_url}
                          className="w-full h-full object-cover"
                          alt={b.name}
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-black uppercase tracking-tight">
                          {b.name}
                        </h5>
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">
                          {b.category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-white/20 group-hover:text-aba-gold transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "signals" && (
            <div className="animate-slide-up space-y-8">
              <SectionHeader 
                title="Buyer Signals" 
                subtitle={`Monitoring ${signals.length} active requirements`}
                icon={Zap}
              />
              <div className="space-y-4">
                {signals.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white/5 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.urgency === "immediate" ? "bg-red-500 text-white" : "bg-aba-gold text-aba-dark"}`}
                        >
                          {s.urgency}
                        </span>
                        <h5 className="text-base font-black uppercase tracking-tight">
                          {s.requirement}
                        </h5>
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {s.buyer_name} • {s.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-white tracking-tighter">
                        {s.volume}
                      </p>
                      <p className="text-[8px] font-black uppercase text-aba-gold tracking-widest mt-1">
                        {s.delivery_region}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
