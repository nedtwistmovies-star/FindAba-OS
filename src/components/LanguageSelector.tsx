import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LanguageCode } from '../providers/LanguageProvider';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'yo', label: 'Yoruba', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="language-selector-container">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-aba-gold/50 text-white/70 hover:text-white transition-all text-xs font-black uppercase tracking-wider active:scale-[0.98]"
        id="language-selector-trigger"
      >
        <Globe size={14} className="text-aba-gold shrink-0" />
        <span className="hidden sm:inline-block">{activeLang.flag} {activeLang.label}</span>
        <span className="sm:hidden">{activeLang.flag}</span>
        <ChevronDown size={12} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-xl bg-aba-deep border border-white/10 shadow-2xl overflow-hidden z-50 animate-fade-in-up"
          id="language-selector-dropdown"
        >
          <div className="py-1 max-h-72 overflow-y-auto scrollbar-hide bg-[#090b0d]">
            <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 bg-black/20">
              {t("Preferred Dialect", "Languages")}
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={async () => {
                  await setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all border-b border-white/5 ${
                  language === lang.code
                    ? 'bg-aba-gold/10 text-aba-gold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm select-none">{lang.flag}</span>
                  <span className="text-[10px] sm:text-xs">
                    {lang.code === 'en' ? t("English (Official)", "English") :
                     lang.code === 'ig' ? t("Igbo (Zonal)", "Igbo") :
                     lang.code === 'pidgin' ? t("Pidgin (Regional)", "Pidgin") :
                     lang.code === 'yo' ? t("Yoruba", "Yoruba") :
                     lang.code === 'ha' ? t("Hausa", "Hausa") :
                     lang.code === 'fr' ? t("French", "French") :
                     lang.code === 'zh' ? t("Chinese", "Chinese") : lang.label}
                  </span>
                </div>
                {language === lang.code && <Check size={12} className="text-aba-gold shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
