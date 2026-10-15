import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface StickyMobileCartBarProps {
  onOpenCart?: () => void;
}

export const StickyMobileCartBar: React.FC<StickyMobileCartBarProps> = ({ onOpenCart }) => {
  const { totalBags, totalWeightKg } = useCart();
  const { t } = useLanguage();
  const location = useLocation();

  // Hide on cart, checkout, or admin routes
  if (totalBags === 0 || location.pathname.startsWith('/admin') || location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur-md border-t-2 border-brand-yellow shadow-2xl p-3 no-print animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="bg-krishna-red text-white text-[10px] font-black px-1.5 py-0.2 rounded-xs">
              {totalBags} {t('bagsCount')}
            </span>
            <span className="text-xs font-black text-deep-charcoal">
              {totalWeightKg} kg
            </span>
          </div>
          <span className="text-[10px] text-krishna-red font-bold">
            {t('rateOnWhatsApp')}
          </span>
        </div>

        {/* Right CTA */}
        {onOpenCart ? (
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-light active:scale-95 text-deep-charcoal font-black text-xs px-4 py-2.5 rounded-xl shadow-md border border-brand-yellow-dark"
          >
            <ShoppingBag className="w-4 h-4 text-deep-charcoal" />
            <span>{t('cartBtn')} ({totalBags})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            to="/cart"
            className="flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-light active:scale-95 text-deep-charcoal font-black text-xs px-4 py-2.5 rounded-xl shadow-md border border-brand-yellow-dark"
          >
            <ShoppingBag className="w-4 h-4 text-deep-charcoal" />
            <span>{t('cartBtn')} ({totalBags})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

      </div>
    </div>
  );
};
