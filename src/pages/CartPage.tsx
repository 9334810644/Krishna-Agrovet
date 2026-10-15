import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  Truck, Scale, ShieldCheck, ArrowLeft, MessageCircle 
} from 'lucide-react';
import { createCartWhatsAppUrl } from '../lib/whatsapp';

export const CartPage: React.FC = () => {
  const { 
    items, updateQuantity, removeItem, clearCart, 
    totalBags, totalWeightKg, deliveryFee,
    isFreeDelivery, bagsForFreeDelivery 
  } = useCart();
  const { settings } = useStoreSettings();
  const { t } = useLanguage();
  const cartWhatsAppUrl = createCartWhatsAppUrl(items, settings.owner_whatsapp, settings.business_name);

  return (
    <div className="py-8 sm:py-12 lg:py-16 bg-warm-cream min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/#products"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-deep-charcoal hover:text-krishna-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-krishna-red" />
            <span>{t('exploreProductsBtn')}</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-krishna-red uppercase tracking-wider mb-1">
              <span>KRISHNA AGROVET • 50 KG SACKS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-deep-charcoal font-heading">
              {t('cartTitle')}
            </h1>
            <p className="text-charcoal-muted text-sm mt-1">
              Verify your bag quantities before entering your farm delivery address.
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-charcoal-muted hover:text-krishna-red self-start sm:self-auto transition-colors"
            >
              {t('clearCart')}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-warm-cream rounded-2xl flex items-center justify-center mx-auto text-charcoal-muted border border-warm-cream-dark">
              <ShoppingBag className="w-8 h-8 text-krishna-red/60" />
            </div>
            <h2 className="text-lg font-bold text-deep-charcoal font-heading">{t('cartEmpty')}</h2>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              {t('cartEmptyDesc')}
            </p>
            <Link
              to="/#products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal text-xs font-black rounded-xl transition-colors shadow-xs border-2 border-brand-yellow-dark"
            >
              <span>{t('exploreProductsBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Free delivery prompt */}
              <div className="bg-white rounded-2xl p-4 border-2 border-brand-yellow/60 shadow-xs">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-deep-charcoal mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-krishna-red" />
                    {isFreeDelivery ? (
                      <strong className="text-krishna-red font-black">{t('freeDeliveryUnlocked')}</strong>
                    ) : (
                      <span>{t('addMoreBagsForFree')} (<strong>{bagsForFreeDelivery} {t('bagsCount')}</strong>)</span>
                    )}
                  </span>
                  <span className="font-black text-krishna-red">
                    {Math.min(totalBags, settings.free_delivery_threshold_bags)} / {settings.free_delivery_threshold_bags}
                  </span>
                </div>
                <div className="w-full bg-warm-cream h-2.5 rounded-full overflow-hidden border border-warm-cream-dark">
                  <div
                    className="bg-brand-yellow-dark h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (totalBags / (settings.free_delivery_threshold_bags || 5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-3xl border-2 border-warm-cream-dark overflow-hidden shadow-sm divide-y divide-warm-cream-dark">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-contain bg-warm-cream p-1 shrink-0 border border-warm-cream-dark"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-krishna-red tracking-wider">
                          {product.brand?.includes('Krishna') ? 'KRISHNA AGROVET' : product.brand}
                        </span>
                        <span className="text-xs text-charcoal-muted">•</span>
                        <span className="text-xs text-charcoal-muted font-bold">
                          {product.bag_weight_kg || 50}kg Standard Sack
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-deep-charcoal font-heading truncate mt-0.5">
                        {product.name}
                      </h3>
                      
                      {/* Bag count & Rate info */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-bold text-charcoal-muted">
                          {quantity} × {product.bag_weight_kg || 50}kg Sack ({quantity * (product.bag_weight_kg || 50)} kg)
                        </span>
                        <span className="text-xs font-bold text-krishna-red bg-krishna-red/10 px-2 py-0.5 rounded-md">
                          Rate on WhatsApp
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Sack Weight */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <div className="flex items-center border-2 border-warm-cream-dark rounded-xl bg-warm-cream overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-2 hover:bg-warm-cream-dark text-deep-charcoal transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-deep-charcoal select-none">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.available_stock}
                          className="p-2 hover:bg-warm-cream-dark text-deep-charcoal disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm font-black text-deep-charcoal">
                          {quantity * (product.bag_weight_kg || 50)} kg Net
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          className="text-charcoal-muted/60 hover:text-krishna-red p-1 transition-colors cursor-pointer"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Col: Order Summary Box */}
            <div className="lg:col-span-4 bg-white rounded-3xl border-2 border-warm-cream-dark p-6 shadow-md space-y-5 sticky top-24">
              <h2 className="text-lg font-black font-heading text-deep-charcoal border-b border-warm-cream-dark pb-3">
                {t('cartTitle')}
              </h2>

              <div className="space-y-3 text-sm text-charcoal-muted">
                <div className="flex justify-between">
                  <span className="font-bold">{t('totalSacks')}:</span>
                  <span className="font-black text-deep-charcoal text-base">{totalBags} {t('bagsCount')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Scale className="w-4 h-4 text-krishna-red" />
                    <span>{t('totalNetWeight')}:</span>
                  </span>
                  <span className="font-black text-deep-charcoal">{totalWeightKg} kg</span>
                </div>

                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-krishna-red" />
                    <span>{t('deliveryCharges')}:</span>
                  </span>
                  <span className={deliveryFee === 0 ? 'font-black text-emerald-700' : 'font-black text-deep-charcoal'}>
                    {deliveryFee === 0 ? t('freeText') : 'Doorstep Farm Delivery'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-warm-cream-dark text-sm sm:text-base font-black text-deep-charcoal">
                  <span>कीमत / Pricing:</span>
                  <span className="text-krishna-red font-heading font-black">
                    व्हाट्सएप पर चर्चा / Rate on WhatsApp
                  </span>
                </div>

                <div className="pt-2">
                  <div className="bg-warm-cream border border-warm-cream-dark rounded-2xl p-4 space-y-1.5 text-xs text-deep-charcoal">
                    <div className="flex items-center gap-2 font-black text-krishna-red text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-krishna-red" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-charcoal-muted text-[11px] leading-relaxed">
                      Payment is collected when the delivery vehicle unloads the cattle feed sacks at your dairy shed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black text-base rounded-2xl shadow-md transition-all active:scale-98 border-2 border-brand-yellow-dark"
                >
                  <span>{t('proceedCheckout')}</span>
                  <ArrowRight className="w-5 h-5 text-deep-charcoal" />
                </Link>

                <a
                  href={cartWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-warm-cream hover:bg-warm-cream-dark border border-warm-cream-dark text-deep-charcoal font-bold text-xs rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>{t('directWhatsAppInquiry')}</span>
                </a>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
