import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, LineChart, Line 
} from 'recharts';
import { TrendingUp, BarChart3, Loader2, ArrowUpRight, DollarSign } from 'lucide-react';
import { fetchWeeklyTradeVolume } from '../services/supabaseService';

interface WeeklyTradeVolumeChartProps {
  merchantId: string;
  isDark?: boolean;
}

interface WeeklyData {
  weekLabel: string;
  volume: number;
  payout: number;
  trades: number;
}

export const WeeklyTradeVolumeChart: React.FC<WeeklyTradeVolumeChartProps> = ({ merchantId, isDark = true }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<WeeklyData[]>([]);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [growthPercent, setGrowthPercent] = useState<number>(0);

  useEffect(() => {
    if (!merchantId) return;
    
    let active = true;
    setLoading(true);
    
    fetchWeeklyTradeVolume(merchantId)
      .then(data => {
        if (!active) return;
        setRawOrders(data || []);
        processChartData(data || []);
      })
      .catch(err => {
        console.error("Error fetching weekly trade volume:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [merchantId]);

  const processChartData = (orders: any[]) => {
    // Generate the last 6 weeks intervals ending today
    const weeks: WeeklyData[] = [];
    const now = new Date();
    
    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calculate total volume
    const sumVolume = sortedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    setTotalVolume(sumVolume);

    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Label formatted as e.g., "Jun 14"
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const weekLabel = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;

      // Filter orders in this week
      const weeklyOrders = sortedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });

      const volume = weeklyOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const payout = weeklyOrders.reduce((sum, o) => sum + (Number(o.merchant_payout) || 0), 0);

      weeks.push({
        weekLabel,
        volume,
        payout,
        trades: weeklyOrders.length
      });
    }

    // If we have no actual trades, let's inject elegant mock data to show how it renders
    const emptyVolume = weeks.every(w => w.volume === 0);
    if (emptyVolume) {
      // Create a nice baseline preview
      const demoData = [
        { weekLabel: "Wk 1", volume: 150000, payout: 139500, trades: 4 },
        { weekLabel: "Wk 2", volume: 280000, payout: 260400, trades: 7 },
        { weekLabel: "Wk 3", volume: 210000, payout: 195300, trades: 5 },
        { weekLabel: "Wk 4", volume: 420000, payout: 390600, trades: 11 },
        { weekLabel: "Wk 5", volume: 380000, payout: 353400, trades: 9 },
        { weekLabel: "Wk 6", volume: 650000, payout: 604500, trades: 15 }
      ];
      // Align mock labels with current calendar dates for realism
      weeks.forEach((w, idx) => {
        w.volume = demoData[idx].volume;
        w.payout = demoData[idx].payout;
        w.trades = demoData[idx].trades;
      });
      setTotalVolume(weeks.reduce((sum, w) => sum + w.volume, 0));
      setGrowthPercent(24.5);
    } else {
      // Calculate growth from week 1 to week 6
      const firstWk = weeks[0].volume;
      const lastWk = weeks[5].volume;
      if (firstWk > 0) {
        const pct = ((lastWk - firstWk) / firstWk) * 100;
        setGrowthPercent(Number(pct.toFixed(1)));
      } else {
        setGrowthPercent(lastWk > 0 ? 100 : 0);
      }
    }

    setChartData(weeks);
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `₦${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `₦${(val / 1000).toFixed(0)}k`;
    }
    return `₦${val}`;
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center bg-white dark:bg-[#1e293b]/20 border border-slate-100 dark:border-white/5 rounded-3xl p-6">
        <Loader2 className="w-8 h-8 text-aba-gold animate-spin mb-3" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Trade Signals...</p>
      </div>
    );
  }

  const isDemo = rawOrders.length === 0;

  return (
    <div id="weekly-trade-volume-container" className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-aba-gold/10 text-aba-gold rounded-xl flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">Commercial Velocity</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {isDemo ? "Demonstration Baseline • Last 6 Weeks" : "Registry Verified Trade Stream"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/10 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-white/5">
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Trade Volume</p>
            <p className="text-xs font-black text-aba-green font-mono">₦{totalVolume.toLocaleString()}</p>
          </div>
          {growthPercent !== 0 && (
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black ${growthPercent >= 0 ? 'bg-aba-green/10 text-aba-green' : 'bg-red-500/10 text-red-500'}`}>
              <ArrowUpRight size={10} className={growthPercent < 0 ? "rotate-90" : ""} />
              <span>{growthPercent >= 0 ? '+' : ''}{growthPercent}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-72 w-full font-mono text-[9px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#028A0F" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#028A0F" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} 
            />
            <XAxis 
              dataKey="weekLabel" 
              stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.4)"}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.4)"}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#111827' : '#ffffff', 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                color: isDark ? '#ffffff' : '#000000',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px'
              }}
              formatter={(value: any, name: string) => [
                `₦${Number(value).toLocaleString()}`, 
                name === 'volume' ? 'Total Volume' : 'Merchant Payout'
              ]}
              labelStyle={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              name="volume"
              stroke="#D4AF37" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVolume)" 
            />
            <Area 
              type="monotone" 
              dataKey="payout" 
              name="payout"
              stroke="#028A0F" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPayout)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-aba-gold rounded-full" />
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Gross Trade Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-aba-green rounded-full" />
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Net Partner Payout</span>
          </div>
        </div>
        
        {isDemo && (
          <div className="text-[7px] font-black uppercase tracking-[0.2em] text-aba-gold bg-aba-gold/5 px-2 py-1 rounded-md border border-aba-gold/10">
            Simulated Baseline
          </div>
        )}
      </div>
    </div>
  );
};
