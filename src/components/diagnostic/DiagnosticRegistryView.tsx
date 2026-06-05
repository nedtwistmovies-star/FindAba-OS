import React, { useEffect, useState } from 'react';
import { 
  getSupabase, 
  fetchThriftGroups 
} from '../../services/supabaseService';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Info, 
  Lock, 
  User, 
  FileText, 
  Hash, 
  DollarSign, 
  Users 
} from 'lucide-react';
import { ThriftGroup } from '../../types';

export const DiagnosticRegistryView: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [clientExists, setClientExists] = useState<boolean | null>(null);
  const [rawKeyLength, setRawKeyLength] = useState<number>(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [records, setRecords] = useState<ThriftGroup[]>([]);
  const [schemaAudit, setSchemaAudit] = useState<{
    thrift_groups: boolean;
    thrift_accounts: boolean;
    thrift_group_members: boolean;
    thrift_group_contributions: boolean;
    thrift_payouts: boolean;
  }>({
    thrift_groups: false,
    thrift_accounts: false,
    thrift_group_members: false,
    thrift_group_contributions: false,
    thrift_payouts: false,
  });

  const runAllDiagnostics = async () => {
    setIsRunning(true);
    setFetchError(null);
    try {
      // 1. Client Checklist
      const supabase = getSupabase();
      if (supabase) {
        setClientExists(true);
        // Safely extract approximate key length
        try {
          // @ts-ignore
          const key = supabase.supabaseKey || '';
          setRawKeyLength(key.length);
        } catch (_) {
          setRawKeyLength(0);
        }
      } else {
        setClientExists(false);
      }

      // 2. Table Existence & Accessibility Check
      if (supabase) {
        const auditResults = { ...schemaAudit };
        const tables = [
          'thrift_accounts',
          'thrift_groups',
          'thrift_group_members',
          'thrift_group_contributions',
          'thrift_payouts'
        ] as const;

        for (const table of tables) {
          const { error } = await supabase.from(table).select('*').limit(1);
          // If error code is 42P01, the table is missing
          auditResults[table] = error ? error.code !== '42P01' : true;
        }
        setSchemaAudit(auditResults);
      }

      // 3. Official thrift_groups Query Logic
      const data = await fetchThriftGroups();
      console.log("[DiagnosticRegistryView] Successfully fetched groups:", data);
      setRecords(data || []);
    } catch (err: any) {
      console.error("[DiagnosticRegistryView] Error during diagnostic sweep:", err);
      setFetchError(err.message || String(err));
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAllDiagnostics();
  }, []);

  // Algorithm for join code explained:
  const inviteCodeSnippet = `const inviteCode = "ABA" + Math.floor(100 + Math.random() * 900) + Math.random().toString(36).substring(2, 4).toUpperCase();`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-widest border border-blue-500/10">
              Diagnostic Mode
            </span>
            <div className={`w-2.5 h-2.5 rounded-full ${fetchError ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Registry Diagnostics</h2>
          <p className="text-xs text-slate-400 font-medium">Verify Supabase credentials, tables health, and trace query data flows.</p>
        </div>
        <button
          onClick={runAllDiagnostics}
          disabled={isRunning}
          className="bg-white hover:bg-slate-100 text-slate-900 disabled:opacity-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Calibrating...' : 'Re-run Sweep'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CHECKLIST PANEL */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900">Infrastructure Checklist</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Verification Status</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className={clientExists ? 'text-emerald-500' : 'text-slate-300'} />
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Client Singleton Status</p>
                    <p className="text-[10px] text-slate-400">Initialized via Supabase Config</p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${clientExists ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {clientExists ? 'Correct' : 'Offline'}
                </span>
              </div>

              {/* API Key Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className={rawKeyLength > 0 ? 'text-emerald-500' : 'text-slate-300'} />
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide">API Anonymous Key Presence</p>
                    <p className="text-[10px] text-slate-400">Length: {rawKeyLength} characters</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                  {rawKeyLength > 0 ? 'Verified' : 'Empty'}
                </span>
              </div>

              {/* Table Schema Audit */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tables Integration Survey</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  {Object.entries(schemaAudit).map(([tableName, exists]) => (
                    <div key={tableName} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="truncate text-slate-600 font-bold">{tableName}:</span>
                      <span className={`font-black uppercase tracking-wide ${exists ? 'text-emerald-600' : 'text-red-500'}`}>
                        {exists ? 'OK' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ERROR SUMMARY PANEL */}
            {fetchError && (
              <div className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <p className="text-xs font-black uppercase tracking-wider">Intercepted Query Failure</p>
                </div>
                <div className="text-[11px] font-mono p-4 bg-white/70 border border-red-200/50 rounded-xl leading-relaxed whitespace-pre-wrap select-all">
                  {fetchError}
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Suggestion: Verify if RLS (Row Level Security) policies allow public/authenticated select from the tables or confirm that the client API key has active schema permissions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* JOIN CODE EXPLAINER */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-lg space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-aba-gold">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">Join Code Engine</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Isusu Circle Security</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold leading-relaxed text-slate-300">
              <p>
                In the Isusu Fidelity ecosystem, invite codes are automatically assigned at creation to restrict private circle contributions.
              </p>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">ALGORITHMIC FORMAT</span>
                <div className="flex flex-wrap gap-1 items-center font-mono text-[10px]">
                  <span className="px-2 py-0.5 bg-neutral-800 text-blue-400 rounded">ABA</span>
                  <span className="text-slate-500 font-light">+</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-emerald-400 rounded">3 Digits</span>
                  <span className="text-slate-500 font-light">+</span>
                  <span className="px-2 py-0.5 bg-neutral-800 text-indigo-400 rounded">2 Alphanumeric</span>
                </div>
                <div className="text-[8px] text-slate-400 font-mono mt-1">
                  Example Output: <span className="text-white font-bold tracking-wider">ABA204RE</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">GENERATION CODE SNIPPET</span>
                <pre className="text-[9px] font-mono p-3 bg-black/40 border border-white/5 rounded-xl whitespace-pre-wrap leading-relaxed overflow-x-auto text-yellow-400/90 leading-tight">
                  {inviteCodeSnippet}
                </pre>
              </div>

              <p className="text-[9px] text-slate-400 leading-relaxed font-normal">
                This algorithm generates dynamic codes starting with "ABA". Private circles require the uppercase invite_code, while public circles are freely visible in discovery searches.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED RESULTS TABLE/LIST */}
      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">Active Records Fetch Response</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">thrift_groups records retrieved in scope</p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest">
            {records.length} Circle{records.length === 1 ? '' : 's'} Detected
          </span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Info className="mx-auto text-slate-300" size={32} />
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Zero Records Returned</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Check if user data permissions or network connectivity are properly set.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((group) => (
              <div 
                key={group.id} 
                className="group border border-slate-100/80 hover:border-blue-200 p-5 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-slate-800"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">{group.name}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      group.visibility === 'public' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {group.visibility}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 tracking-tight">({group.id})</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} /> {group.contribution_amount.toLocaleString()} NG
                    </span>
                    <span>•</span>
                    <span>Cycle: {group.cycle_length} cycles</span>
                    <span>•</span>
                    <span className="capitalize">{group.payout_frequency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-[10px]">
                  <div className="bg-slate-100/70 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 font-black flex items-center gap-1.5">
                    <Hash size={10} />
                    <span>Invite:</span>
                    <span className="text-slate-800 select-all tracking-wider font-extrabold">{group.invite_code || 'PUBLIC'}</span>
                  </div>
                  <div className="bg-slate-100/70 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 font-bold">
                    Status: <span className="text-slate-900 font-black uppercase tracking-wide">{group.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
