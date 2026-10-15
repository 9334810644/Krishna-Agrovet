import React, { useEffect, useState, useRef } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { X, ShoppingBag, Plus, Minus, Check, Truck, MessageCircle, Scale, Camera, Loader2, AlertCircle } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';
import { compressDeviceImage } from '../../lib/imageCompression';
import { dataService } from '../../lib/firebase';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  allProducts = [], 
  onSelectProduct, 
  onProductUpdated,
  onClose 
}) => {
  const { addItem, items } = useCart();
  const { lang, t } = useLanguage();
  const { settings } = useStoreSettings();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoSuccess, setPhotoSuccess] = useState<boolean>(false);
  const [modalPhotoError, setModalPhotoError] = useState<string | null>(null);

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setUploadingPhoto(true);
    setModalPhotoError(null);
    try {
      const res = await compressDeviceImage(file, 900, 0.85);
      const updatedProduct: Product = {
        ...product,
        image_url: res.dataUrl,
        updated_at: new Date().toISOString()
      };
      await dataService.saveProduct(updatedProduct);
      setPhotoSuccess(true);
      setTimeout(() => setPhotoSuccess(false), 2500);
      onProductUpdated?.(updatedProduct);
    } catch (err: any) {
      console.error('Error updating modal product photo:', err);
      setModalPhotoError(err.message || 'Failed to update photo from device');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setIsAdded(false);
      setErrorMsg(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  const cartItem = items.find(i => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, product.available_stock - inCartQty);
  const isOutOfStock = product.available_stock <= 0;

  const cleanWhatsAppNumber = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const productWhatsAppUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${settings.business_name}, मुझे ${product.name} (50 किग्रा बोरी) की उपलब्धता और फार्म डिलीवरी के बारे में जानना है।`
      : `Namaste ${settings.business_name}, I want to ask about ${product.name} (50kg bag) availability and doorstep farm delivery.`
  )}`;

  const relatedProducts = allProducts.filter(p => p.id !== product.id && p.is_active).slice(0, 3);

  const handleIncrement = () => {
    if (quantity < remainingStock) {
      setQuantity(q => q + 1);
      setErrorMsg(null);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
      setErrorMsg(null);
    }
  };

  const handleAddToCart = () => {
    setErrorMsg(null);
    const result = addItem(product, quantity);
    if (result.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-warm-cream-dark modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/95 hover:bg-warm-cream text-deep-charcoal flex items-center justify-center shadow-md border border-warm-cream-dark transition-colors cursor-pointer"
          aria-label="Close product details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Image */}
        <div className="relative h-64 sm:h-76 bg-gradient-to-b from-warm-cream via-white to-warm-cream p-6 flex items-center justify-center overflow-hidden border-b border-warm-cream-dark">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain filter drop-shadow-lg"
          />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="bg-deep-charcoal text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs">
              {product.brand?.includes('Krishna') ? 'KRISHNA AGROVET' : product.brand}
            </span>
            <span className="bg-brand-yellow text-deep-charcoal text-xs font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-deep-charcoal" />
              <span>{product.bag_weight_kg || 50} kg Standard Bag</span>
            </span>
          </div>

          {/* Packaging Overlay Pill across bottom of image */}
          {product.packaging_info && (
            <div className="absolute bottom-3 left-4 right-4 bg-stone-900/85 backdrop-blur-xs text-white text-xs sm:text-sm font-black py-1.5 px-3 rounded-xl text-center shadow-md border border-white/20">
              {product.packaging_info}
            </div>
          )}

          {/* Admin Change Photo Button in Modal */}
          {isAdmin && (
            <div className="absolute bottom-4 right-4 z-10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleModalPhotoUpload}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-deep-charcoal/90 hover:bg-krishna-red text-white text-xs font-bold shadow-lg border-2 border-brand-yellow transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Change photo from camera/gallery (Owner)"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
                    <span>Compressing & Saving...</span>
                  </>
                ) : photoSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-brand-yellow" />
                    <span>Photo Updated!</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-brand-yellow" />
                    <span>Change Photo from Device</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {modalPhotoError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{modalPhotoError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Title & Brand */}
          <div className="space-y-2">
            <h2 id="product-modal-title" className="text-xl sm:text-2xl font-black font-heading text-deep-charcoal leading-tight">
              {product.name}
            </h2>
            
            {/* Packaging and Rate banner */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-krishna-red bg-krishna-red/10 px-3 py-1.5 rounded-xl border border-krishna-red/20 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4 text-krishna-red" />
                  <span>{t('rateOnWhatsApp')}</span>
                </span>
                <span className="text-xs text-charcoal-muted font-bold">
                  {product.bag_weight_kg || 50} kg {t('standard50kg')}
                </span>
              </div>

              <div>
                {isOutOfStock ? (
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-lg border border-rose-200">
                    {t('outOfStockText')}
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-200">
                    {t('inStockText')} ({product.available_stock} bags)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description & Key Features - Checklist Style from authentic product packaging */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
              Description & Key Features
            </h3>
            
            {product.features && product.features.length > 0 ? (
              <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-2xl border border-warm-cream-dark space-y-3.5 shadow-2xs">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-stone-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs sm:text-sm text-deep-charcoal leading-relaxed font-medium">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-2xl border border-warm-cream-dark space-y-3.5 shadow-2xs">
                {product.description.split('\n\n').filter(Boolean).map((para, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-stone-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs sm:text-sm text-deep-charcoal leading-relaxed font-medium">
                      {para.trim()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Nutritional Specs */}
          {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
                {t('nutritionSpecs')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(product.nutritional_info).map(([key, value]) => {
                  if (!value) return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={key} className="bg-warm-cream/60 border border-warm-cream-dark p-3 rounded-xl">
                      <span className="block text-[10px] text-charcoal-muted font-bold uppercase">{label}</span>
                      <span className="font-black text-sm text-deep-charcoal">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feeding Guide if present */}
          {product.feeding_guide && (
            <div className="space-y-1.5 bg-brand-yellow/15 border border-brand-yellow/50 p-4 rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-charcoal flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-krishna-red" />
                <span>{t('feedingGuide')}</span>
              </h3>
              <p className="text-xs text-deep-charcoal leading-relaxed font-medium">
                {product.feeding_guide}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-warm-cream-dark flex flex-col sm:flex-row items-center gap-3">
            {!isOutOfStock ? (
              <>
                {/* Quantity Stepper */}
                <div className="flex items-center border-2 border-warm-cream-dark rounded-xl bg-warm-cream overflow-hidden h-12 w-full sm:w-auto shrink-0 justify-between">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="px-3 h-full hover:bg-warm-cream-dark text-deep-charcoal disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-sm text-deep-charcoal">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= remainingStock}
                    className="px-3 h-full hover:bg-warm-cream-dark text-deep-charcoal disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={remainingStock <= 0}
                  className={`flex-1 w-full h-12 flex items-center justify-center gap-2 rounded-xl font-black text-sm shadow-md transition-all active:scale-98 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : remainingStock <= 0
                      ? 'bg-warm-cream-dark text-charcoal-muted cursor-not-allowed'
                      : 'bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal border-2 border-brand-yellow-dark'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{t('addedBtn')}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 text-deep-charcoal" />
                      <span>{t('addBagBtn')} ({quantity} {t('bagsCount')})</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="w-full py-3 text-center bg-warm-cream text-charcoal-muted font-bold rounded-xl border border-warm-cream-dark text-sm">
                {t('outOfStockText')}
              </div>
            )}

            {/* Direct WhatsApp button */}
            <a
              href={productWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-12 px-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-sm transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && onSelectProduct && (
            <div className="pt-6 border-t border-warm-cream-dark space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
                Related Cattle Feed Lines
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedProducts.map(rel => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectProduct(rel)}
                    className="flex items-center gap-2.5 p-2.5 bg-warm-cream hover:bg-warm-cream-dark/60 rounded-2xl border border-warm-cream-dark text-left transition-colors cursor-pointer group"
                  >
                    <img
                      src={rel.image_url}
                      alt={rel.name}
                      className="w-12 h-12 object-contain bg-white rounded-xl p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-deep-charcoal truncate group-hover:text-krishna-red">
                        {rel.name}
                      </span>
                      <span className="block text-[10px] text-krishna-red font-bold">
                        {t('rateOnWhatsApp')} • {rel.bag_weight_kg || 50} kg
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
