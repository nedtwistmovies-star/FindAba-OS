import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, X, CheckCircle2, Send, MapPin, Phone, Building2, Tag, ArrowRight } from 'lucide-react';
import { ABA_AREAS, CATEGORIES } from '../constants';
import { submitListingRequest } from '../services/localSearchService';
import { useToast } from '../providers/ToastProvider';

interface RequestListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialCategory?: string;
  onNavigateToRegister?: () => void;
}

export const RequestListingModal: React.FC<RequestListingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  initialCategory = '',
  onNavigateToRegister
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0]);
  const [area, setArea] = useState(ABA_AREAS[0]);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
      if (!businessName) {
        setBusinessName(initialQuery);
      }
    }
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      addToast('Please enter the trade, service, or business term.', 'error');
      return;
    }

    setIsSubmitting(true);
    const success = await submitListingRequest({
      query: searchTerm.trim(),
      businessName: businessName.trim() || undefined,
      category: category || undefined,
      area: area || undefined,
      contactPhone: phone.trim() || undefined,
      isOwner,
      notes: notes.trim() || undefined
    });

    setIsSubmitting(false);
    if (success) {
      setIsSubmitted(true);
      addToast(`Listing request logged! FindAba team will review "${searchTerm}".`, 'success');
    } else {
      addToast('Failed to submit listing request. Please try again.', 'error');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#11161B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {isSubmitted ? (
            <div className="py-8 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Listing Request Received!
                </h3>
                <p className="text-white/60 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Thank you for helping expand FindAba. Our field scouts verify local artisans and businesses matching <span className="text-aba-gold font-bold">"{searchTerm}"</span> across Aba.
                </p>
              </div>

              {isOwner && onNavigateToRegister && (
                <div className="p-4 rounded-2xl bg-aba-gold/10 border border-aba-gold/20 text-left space-y-2">
                  <p className="text-aba-gold text-xs font-black uppercase tracking-wider">
                    Are you the business owner?
                  </p>
                  <p className="text-white/70 text-xs">
                    You can finish onboarding now to claim your verified merchant profile immediately.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToRegister();
                    }}
                    className="w-full py-2.5 px-4 bg-aba-gold text-aba-deep rounded-xl font-black text-xs uppercase tracking-wider hover:bg-aba-gold/90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Merchant Registration</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-aba-gold/10 border border-aba-gold/20 text-aba-gold flex items-center justify-center shrink-0">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    Request a Business Listing
                  </h3>
                  <p className="text-white/50 text-xs">
                    Can't find a business in Aba? Tell us what to list.
                  </p>
                </div>
              </div>

              {/* Input: Query / Trade */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <Tag size={12} className="text-aba-gold" />
                  <span>Search Term or Trade *</span>
                </label>
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Fashion Designer, Ariaria Shoe Master"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-aba-gold focus:outline-none transition-colors"
                />
              </div>

              {/* Input: Business Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <Building2 size={12} className="text-aba-gold" />
                  <span>Specific Business Name (Optional)</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Master-Link Leather Works"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-aba-gold focus:outline-none transition-colors"
                />
              </div>

              {/* Category & Area Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <span>Category</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-aba-gold focus:outline-none transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-aba-deep text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <MapPin size={12} className="text-aba-gold" />
                    <span>Area in Aba</span>
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:border-aba-gold focus:outline-none transition-colors"
                  >
                    {ABA_AREAS.map((a) => (
                      <option key={a} value={a} className="bg-aba-deep text-white">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone / WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <Phone size={12} className="text-aba-gold" />
                  <span>Contact Phone / WhatsApp (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-aba-gold focus:outline-none transition-colors"
                />
              </div>

              {/* Is Owner Toggle */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">I own or operate this business</p>
                  <p className="text-[10px] text-white/40">Check this if you want to claim this listing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isOwner}
                  onChange={(e) => setIsOwner(e.target.checked)}
                  className="w-4 h-4 rounded text-aba-gold focus:ring-0 cursor-pointer accent-aba-gold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:w-1/3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:w-2/3 py-3 bg-aba-gold hover:bg-aba-gold/90 text-aba-deep font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
