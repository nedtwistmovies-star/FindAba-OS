
import React from 'react';
import { Product } from '../types';
import { X, Package, Tag, Archive, DollarSign, Edit3, Trash2 } from 'lucide-react';

interface ProductDetailOverlayProps {
  product: Product;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ProductDetailOverlay: React.FC<ProductDetailOverlayProps> = ({ product, onClose, onEdit, onDelete }) => {
  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col md:flex-row">
        
        {/* Visual Documentation */}
        <div className="md:w-1/2 aspect-square md:aspect-auto h-80 md:h-auto relative bg-slate-100 shrink-0">
          <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
          <button 
            onClick={onClose} 
            className="md:hidden absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-xl"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Technical Data */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-between space-y-10">
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                   <div className="px-3 py-1 bg-aba-dark text-aba-gold rounded-lg text-[8px] font-black uppercase tracking-widest">Registry ID: {product.id.slice(-6)}</div>
                   {product.stock_count && product.stock_count > 0 ? (
                     <div className="px-3 py-1 bg-aba-green/10 text-aba-green rounded-lg text-[8px] font-black uppercase tracking-widest">In Stock</div>
                   ) : (
                     <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Sold Out</div>
                   )}
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight">{product.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">SKU Node: {product.sku || 'N/A'}</p>
              </div>
              <button 
                onClick={onClose} 
                className="hidden md:flex p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-aba-dark transition-all active:scale-90"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
               <div className="space-y-1.5">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Commercial Price</p>
                  <p className="text-2xl font-black text-aba-green">₦{product.price.toLocaleString()}</p>
               </div>
               <div className="space-y-1.5">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Volume Stock</p>
                  <p className="text-2xl font-black text-slate-900">{product.stock_count || 0} <span className="text-xs font-bold text-slate-300 uppercase">Units</span></p>
               </div>
            </div>

            {product.description && (
              <div className="space-y-3">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Specification Brief</p>
                 <p className="text-xs text-slate-600 leading-relaxed font-medium">{product.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              onClick={onEdit}
              className="flex-1 py-5 bg-aba-dark text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-aba-gold hover:text-aba-dark"
            >
              <Edit3 size={16}/> Edit Unit
            </button>
            <button 
              onClick={onDelete}
              className="px-6 py-5 border-2 border-red-50 text-red-400 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
            >
              <Trash2 size={20}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailOverlay;
