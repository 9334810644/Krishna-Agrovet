import React, { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { createCartWhatsAppUrl } from '../../lib/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    items, updateQuantity, removeItem, clearCart, 
    totalBags, totalWeightKg
  } = useCart();
  const { settings } = useStoreSettings();
  const { lang, t } = useLanguage();
  const cartWhatsAppUrl = createCartWhatsAppUrl(items, settings.owner_whatsapp, settings.business_name, lang);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-deep-charcoal/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l-2 border-warm-cream-dark animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-krishna-red flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <h2 className="text-base font-black font-heading text-deep-charcoal">
                  {t('cartTitle')}
                </h2>
                <span className="text-[11px] text-charcoal-muted font-bold block">
                  KRISHNA AGROVET • CATTLE FEED
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-charcoal-muted hover:text-krishna-red hover:bg-warm-cream-dark rounded-xl transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-warm-cream/30">
            {items.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4">
                <div className="w-16 h-16 bg-warm-cream rounded-2xl flex items-center justify-center mx-auto text-charcoal-muted border border-warm-cream-dark">
                  <ShoppingBag className="w-8 h-8 text-krishna-red/60" />
                </div>
                <h3 className="text-base font-bold text-deep-charcoal font-heading">
                  {t('cartEmpty')}
                </h3>
                <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                  {t('cartEmptyDesc')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal text-xs font-black rounded-xl transition-colors border border-brand-yellow-dark"
                >
                  <span>{t('exploreProductsBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="p-3.5 bg-white rounded-2xl border-2 border-warm-cream-dark shadow-xs flex gap-3.5 items-center"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-contain bg-warm-cream p-1 shrink-0 border border-warm-cream-dark"
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-black text-krishna-red">
                      {product.brand?.includes('Krishna') ? 'KRISHNA AGROVET' : product.brand}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-deep-charcoal truncate font-heading">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-charcoal-muted">
                        {quantity} × {product.bag_weight_kg || 50}kg ({quantity * (product.bag_weight_kg || 50)} kg)
                      </span>
                      <span className="text-[10px] font-bold text-krishna-red bg-krishna-red/10 px-1.5 py-0.5 rounded">
                        Rate on WhatsApp
                      </span>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center border border-warm-cream-dark rounded-lg bg-warm-cream overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1 hover:bg-warm-cream-dark text-deep-charcoal transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-deep-charcoal select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.available_stock}
                        className="p-1 hover:bg-warm-cream-dark text-deep-charcoal disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="text-charcoal-muted/60 hover:text-krishna-red p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals & Checkout Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t-2 border-warm-cream-dark bg-white space-y-3.5">
              
              {/* Summary calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-charcoal-muted font-bold">
                  <span>{t('totalSacks')}:</span>
                  <span className="text-deep-charcoal font-black">{totalBags} {t('bagsCount')}</span>
                </div>

                <div className="flex justify-between text-charcoal-muted font-bold">
                  <span>{t('totalNetWeight')}:</span>
                  <span className="text-deep-charcoal font-black">{totalWeightKg} kg</span>
                </div>

                <div className="flex justify-between text-charcoal-muted font-bold">
                  <span>{t('deliveryCharges')}:</span>
                  <span className="text-deep-charcoal font-black">
                    Doorstep Farm Delivery
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-warm-cream-dark text-xs sm:text-sm font-bold text-deep-charcoal">
                  <span>कीमत / Pricing:</span>
                  <span className="text-krishna-red font-black">
                    व्हाट्सएप पर चर्चा / Rate on WhatsApp
                  </span>
                </div>
              </div>

              {/* Notice for new customers */}
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-950 leading-snug">
                  {t('newCustomerNotice')}
                </p>
              </div>

              {/* Single WhatsApp Order Button */}
              <a
                href={cartWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white font-black text-sm rounded-xl shadow-md transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>{t('placeOrderViaWhatsApp')}</span>
              </a>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-bold text-charcoal-muted hover:text-krishna-red transition-colors cursor-pointer"
                >
                  {t('clearCart')}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
