import React, { useState, useMemo } from 'react';
import { 
  Search, Smartphone, Copy, Check, PhoneCall, 
  ExternalLink, ArrowLeft, Building2, Zap, Shield, Sparkles, CheckCircle2,
  SlidersHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../providers/ToastProvider';

export interface NigerianBank {
  id: string;
  name: string;
  shortName: string;
  ussdCode: string;
  ussdFormat?: string;
  bankCode?: string;
  category: 'tier-1' | 'commercial' | 'digital';
  color: string;
  textColor?: string;
  popular?: boolean;
  tagline?: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  {
    id: 'gtb',
    name: 'Guaranty Trust Bank (GTBank)',
    shortName: 'GTBank',
    ussdCode: '*737#',
    ussdFormat: '*737*2*{amount}#',
    bankCode: '058',
    category: 'tier-1',
    color: '#DD4F05',
    popular: true,
    tagline: '737 Simple Banking'
  },
  {
    id: 'zenith',
    name: 'Zenith Bank',
    shortName: 'Zenith',
    ussdCode: '*966#',
    ussdFormat: '*966*{amount}#',
    bankCode: '057',
    category: 'tier-1',
    color: '#B30000',
    popular: true,
    tagline: 'Eazy Banking'
  },
  {
    id: 'uba',
    name: 'United Bank for Africa (UBA)',
    shortName: 'UBA',
    ussdCode: '*919#',
    ussdFormat: '*919*4*{amount}#',
    bankCode: '033',
    category: 'tier-1',
    color: '#D10000',
    popular: true,
    tagline: 'Magic Banking'
  },
  {
    id: 'access',
    name: 'Access Bank',
    shortName: 'Access',
    ussdCode: '*901#',
    ussdFormat: '*901*{amount}#',
    bankCode: '044',
    category: 'tier-1',
    color: '#004B87',
    popular: true,
    tagline: 'More than Banking'
  },
  {
    id: 'firstbank',
    name: 'First Bank of Nigeria',
    shortName: 'FirstBank',
    ussdCode: '*894#',
    ussdFormat: '*894*{amount}#',
    bankCode: '011',
    category: 'tier-1',
    color: '#113366',
    popular: true,
    tagline: 'You First'
  },
  {
    id: 'fidelity',
    name: 'Fidelity Bank',
    shortName: 'Fidelity',
    ussdCode: '*770#',
    ussdFormat: '*770*{amount}#',
    bankCode: '070',
    category: 'commercial',
    color: '#1B2C68',
    popular: true,
    tagline: 'We Keep Our Word'
  },
  {
    id: 'wema',
    name: 'Wema Bank (ALAT)',
    shortName: 'Wema / ALAT',
    ussdCode: '*945#',
    ussdFormat: '*945*{amount}#',
    bankCode: '035',
    category: 'commercial',
    color: '#7D0A4E',
    popular: true,
    tagline: 'Purple Magic'
  },
  {
    id: 'stanbic',
    name: 'Stanbic IBTC Bank',
    shortName: 'Stanbic IBTC',
    ussdCode: '*909#',
    ussdFormat: '*909*22*{amount}#',
    bankCode: '221',
    category: 'commercial',
    color: '#0033A0',
    popular: true,
    tagline: 'Moving Forward'
  },
  {
    id: 'opay',
    name: 'OPay Digital Services',
    shortName: 'OPay',
    ussdCode: '*955#',
    ussdFormat: '*955*{amount}#',
    bankCode: '999992',
    category: 'digital',
    color: '#00B875',
    popular: true,
    tagline: 'Fast Digital Pay'
  },
  {
    id: 'palmpay',
    name: 'PalmPay Nigeria',
    shortName: 'PalmPay',
    ussdCode: '*652#',
    ussdFormat: '*652*{amount}#',
    bankCode: '999991',
    category: 'digital',
    color: '#4F46E5',
    popular: true,
    tagline: 'Rewards & Speed'
  },
  {
    id: 'kuda',
    name: 'Kuda Microfinance Bank',
    shortName: 'Kuda Bank',
    ussdCode: '*5573#',
    ussdFormat: '*5573*{amount}#',
    bankCode: '50211',
    category: 'digital',
    color: '#40196D',
    popular: true,
    tagline: 'The Bank of the Free'
  },
  {
    id: 'moniepoint',
    name: 'Moniepoint MFB',
    shortName: 'Moniepoint',
    ussdCode: '*5573#',
    ussdFormat: '*5573*{amount}#',
    bankCode: '50515',
    category: 'digital',
    color: '#003399',
    popular: true,
    tagline: 'Powering Trade'
  },
  {
    id: 'union',
    name: 'Union Bank of Nigeria',
    shortName: 'Union Bank',
    ussdCode: '*826#',
    ussdFormat: '*826*{amount}#',
    bankCode: '032',
    category: 'commercial',
    color: '#00AEEF',
    popular: false,
    tagline: 'Your Simpler Bank'
  },
  {
    id: 'polaris',
    name: 'Polaris Bank',
    shortName: 'Polaris',
    ussdCode: '*833#',
    ussdFormat: '*833*{amount}#',
    bankCode: '076',
    category: 'commercial',
    color: '#532380',
    popular: false,
    tagline: 'The Polaris Way'
  },
  {
    id: 'sterling',
    name: 'Sterling Bank',
    shortName: 'Sterling',
    ussdCode: '*822#',
    ussdFormat: '*822*{amount}#',
    bankCode: '232',
    category: 'commercial',
    color: '#8A0000',
    popular: false,
    tagline: 'Your One-Bank'
  },
  {
    id: 'fcmb',
    name: 'First City Monument Bank (FCMB)',
    shortName: 'FCMB',
    ussdCode: '*329#',
    ussdFormat: '*329*{amount}#',
    bankCode: '214',
    category: 'commercial',
    color: '#5C068C',
    popular: false,
    tagline: 'My Bank and I'
  },
  {
    id: 'ecobank',
    name: 'Ecobank Nigeria',
    shortName: 'Ecobank',
    ussdCode: '*326#',
    ussdFormat: '*326*{amount}#',
    bankCode: '050',
    category: 'commercial',
    color: '#005CA9',
    popular: false,
    tagline: 'The Pan-African Bank'
  },
  {
    id: 'keystone',
    name: 'Keystone Bank',
    shortName: 'Keystone',
    ussdCode: '*7111#',
    ussdFormat: '*7111*{amount}#',
    bankCode: '082',
    category: 'commercial',
    color: '#004B87',
    popular: false,
    tagline: 'Never Say Never'
  },
  {
    id: 'unity',
    name: 'Unity Bank',
    shortName: 'Unity Bank',
    ussdCode: '*7799#',
    ussdFormat: '*7799*{amount}#',
    bankCode: '215',
    category: 'commercial',
    color: '#E0711E',
    popular: false,
    tagline: 'Succeed Together'
  },
  {
    id: 'jaiz',
    name: 'Jaiz Bank',
    shortName: 'Jaiz Bank',
    ussdCode: '*773#',
    ussdFormat: '*773*{amount}#',
    bankCode: '301',
    category: 'commercial',
    color: '#008751',
    popular: false,
    tagline: 'Non-Interest Banking'
  },
  {
    id: 'taj',
    name: 'TAJBank',
    shortName: 'TAJBank',
    ussdCode: '*898#',
    ussdFormat: '*898*{amount}#',
    bankCode: '302',
    category: 'commercial',
    color: '#9C7A14',
    popular: false,
    tagline: 'Ethical Banking'
  }
];

export interface BankSelectorProps {
  amount?: number;
  onSelectBank?: (bank: NigerianBank) => void;
  onProceedWithPaystack?: (bank: NigerianBank) => void;
  onBack?: () => void;
  selectedBankId?: string;
  className?: string;
  isPaystackActive?: boolean;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  amount = 0,
  onSelectBank,
  onProceedWithPaystack,
  onBack,
  selectedBankId,
  className = '',
  isPaystackActive = true
}) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'tier-1' | 'commercial' | 'digital'>('all');
  const [activeBank, setActiveBank] = useState<NigerianBank | null>(() => {
    if (selectedBankId) {
      return NIGERIAN_BANKS.find(b => b.id === selectedBankId) || null;
    }
    return NIGERIAN_BANKS[0]; // Default to GTBank
  });
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredBanks = useMemo(() => {
    return NIGERIAN_BANKS.filter(bank => {
      const matchesSearch = 
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.ussdCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'popular') return !!bank.popular;
      return bank.category === selectedCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleBankClick = (bank: NigerianBank) => {
    setActiveBank(bank);
    if (onSelectBank) {
      onSelectBank(bank);
    }
  };

  const getDialString = (bank: NigerianBank) => {
    if (amount > 0 && bank.ussdFormat) {
      return bank.ussdFormat.replace('{amount}', Math.round(amount).toString());
    }
    return bank.ussdCode;
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    addToast(`Copied ${code} to clipboard`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDial = (code: string) => {
    // Clean string for tel link
    const cleanTel = code.replace(/#/g, '%23');
    window.location.href = `tel:${cleanTel}`;
  };

  return (
    <div id="bank-selector-root" className={`flex flex-col space-y-4 md:space-y-5 animate-slide-up text-aba-deep ${className}`}>
      
      {/* Header & Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aba-gold/10 border border-aba-gold/20 text-aba-dark text-[8px] font-black uppercase tracking-widest mb-1">
          <Smartphone size={12} className="text-aba-gold" />
          <span>USSD Interactive Gateway</span>
        </div>
        <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-aba-dark">
          Select Your Bank
        </h3>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Curated Nigerian Banking USSD Codes
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          id="bank-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bank name or USSD code (e.g. *737#, Zenith, UBA)..."
          className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-aba-dark placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-aba-gold focus:bg-white transition-all shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[8px] font-black uppercase tracking-widest">
        {[
          { id: 'all', label: `All (${NIGERIAN_BANKS.length})` },
          { id: 'popular', label: 'Popular' },
          { id: 'tier-1', label: 'Tier-1' },
          { id: 'commercial', label: 'Commercial' },
          { id: 'digital', label: 'Digital / MFB' }
        ].map((cat) => (
          <button
            key={cat.id}
            id={`filter-bank-${cat.id}`}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-aba-dark text-white shadow-sm scale-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Curated Bank Grid */}
      <div 
        id="bank-grid-container"
        className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 max-h-[220px] md:max-h-[240px] overflow-y-auto pr-1 scrollbar-hide py-1"
      >
        {filteredBanks.length === 0 ? (
          <div className="col-span-2 py-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="mx-auto text-slate-300" size={28} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching bank found</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="text-[9px] font-black text-aba-gold uppercase tracking-widest hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredBanks.map((bank) => {
            const isSelected = activeBank?.id === bank.id;
            return (
              <button
                key={bank.id}
                id={`bank-card-${bank.id}`}
                onClick={() => handleBankClick(bank)}
                className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group active:scale-[0.98] ${
                  isSelected 
                    ? 'border-aba-gold bg-amber-50/50 shadow-md ring-2 ring-aba-gold/30' 
                    : 'border-slate-100 bg-slate-50/70 hover:border-slate-300 hover:bg-white shadow-sm'
                }`}
              >
                {/* Top Row: Icon + Selection Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] text-white shadow-sm shrink-0"
                    style={{ backgroundColor: bank.color }}
                  >
                    {bank.shortName.substring(0, 2).toUpperCase()}
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-aba-gold flex items-center justify-center text-aba-dark shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : bank.popular ? (
                    <span className="text-[7px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                      Top
                    </span>
                  ) : null}
                </div>

                {/* Bank Name */}
                <div className="space-y-0.5 min-h-[32px]">
                  <p className="text-[10px] font-black text-aba-dark tracking-tight leading-tight line-clamp-1">
                    {bank.shortName}
                  </p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                    {bank.tagline || bank.name}
                  </p>
                </div>

                {/* USSD Code Tag */}
                <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-aba-gold tracking-tight">
                    {bank.ussdCode}
                  </span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase group-hover:text-aba-dark transition-colors">
                    Dial
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Active Selected Bank Action Box */}
      {activeBank && (
        <div 
          id="active-bank-action-panel"
          className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-xl border border-white/10 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] text-white shadow-sm"
                style={{ backgroundColor: activeBank.color }}
              >
                {activeBank.shortName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-tight text-white">
                  {activeBank.name}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                  {amount > 0 ? `Amount: ₦${Math.round(amount).toLocaleString()}` : 'USSD Quick Dial'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-black text-aba-gold tracking-tight px-2 py-0.5 bg-white/10 rounded-md border border-white/5">
                {getDialString(activeBank)}
              </span>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="copy-ussd-code-btn"
              onClick={(e) => handleCopyCode(getDialString(activeBank), e)}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              {copiedCode ? <Check size={13} className="text-aba-green" /> : <Copy size={13} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              id="dial-ussd-code-btn"
              onClick={() => handleDial(getDialString(activeBank))}
              className="py-2.5 px-3 bg-aba-gold text-aba-dark rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md hover:bg-amber-400"
            >
              <PhoneCall size={13} />
              <span>Dial on Phone</span>
            </button>
          </div>

          {/* Proceed with Paystack USSD Gateway */}
          {isPaystackActive && onProceedWithPaystack && (
            <button
              id="proceed-paystack-ussd-btn"
              onClick={() => onProceedWithPaystack(activeBank)}
              className="w-full py-3 bg-gradient-to-r from-aba-gold via-amber-400 to-amber-500 text-aba-deep rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-aba-gold/20 active:scale-95 transition-all mt-2"
            >
              <Zap size={14} className="fill-current" />
              <span>Pay with {activeBank.shortName} USSD</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation Footer */}
      {onBack && (
        <button 
          id="bank-selector-back-btn"
          onClick={onBack} 
          className="w-full py-2.5 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-aba-deep transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={13} /> Back to Channels
        </button>
      )}

    </div>
  );
};

export default BankSelector;
