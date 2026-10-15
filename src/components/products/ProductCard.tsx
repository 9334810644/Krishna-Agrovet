import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Plus, Minus, Info, Check, AlertCircle, MessageCircle, Camera, Loader2 } from 'lucide-react';
import { compressDeviceImage } from '../../lib/imageCompression';
import { dataService } from '../../lib/firebase';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails, onProductUpdated }) => {
  const { addItem, items } = useCart();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoSuccess, setPhotoSuccess] = useState<boolean>(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage(null);
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
      console.error('Error updating product photo from device:', err);
      setErrorMessage(err.message || 'Failed to update photo from device');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Check how many of this item is already in the cart
  const cartItem = items.find(i => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, product.available_stock - inCartQty);

  const isOutOfStock = product.available_stock <= 0;
  const isLowStock = !isOutOfStock && product.available_stock <= product.low_stock_threshold;

  // Product specific color accents
  const isTurquoiseLine = product.sku?.includes('EKS') || product.name.toLowerCase().includes('ekstrapro');
  const accentBorderColor = isTurquoiseLine ? 'hover:border-feed-turquoise' : 'hover:border-krishna-red';

  const handleIncrement = () => {
    if (quantity < remainingStock) {
      setQuantity(q => q + 1);
      setErrorMessage(null);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
      setErrorMessage(null);
    }
  };

  const handleAddToCart = () => {
    setErrorMessage(null);
    const result = addItem(product, quantity);
    if (result.success) {
      setIsAddedFeedback(true);
      setQuantity(1);
      setTimeout(() => setIsAddedFeedback(false), 2000);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-warm-cream-dark ${accentBorderColor} card-hover-lift overflow-hidden group`}>
      
      {/* Product Image Box - object-contain so bag shape is completely undistorted */}
      <div 
        className="relative aspect-4/3 bg-gradient-to-b from-warm-cream via-white to-warm-cream p-4 overflow-hidden cursor-pointer flex items-center justify-center" 
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out filter drop-shadow-md"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          <span className="bg-deep-charcoal text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
            {product.brand?.includes('Krishna') ? 'KRISHNA AGROVET' : product.brand}
          </span>
          {product.featured && (
            <span className="bg-brand-yellow text-deep-charcoal text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Bag Weight Pill or Packaging Info Overlay */}
        {product.packaging_info ? (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-black py-1 px-2 rounded-lg text-center shadow-md border border-white/20 truncate">
            {product.packaging_info}
          </div>
        ) : (
          <div className="absolute bottom-2.5 left-2.5 bg-white text-deep-charcoal text-xs font-black px-2.5 py-1 rounded-lg shadow-sm border border-warm-cream-dark">
            {product.bag_weight_kg || 50} kg {t('bagWeightUnit')}
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="bg-rose-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
              {t('outOfStockText')}
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm animate-pulse">
              {t('lowStockText')} ({product.available_stock})
            </span>
          ) : (
            <span className="bg-emerald-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              {t('inStockText')} ({product.available_stock})
            </span>
          )}
        </div>

        {/* Admin Direct Photo Upload Badge */}
        {isAdmin && (
          <div 
            className="absolute top-2.5 right-2.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-deep-charcoal/90 hover:bg-krishna-red text-white text-[11px] font-bold shadow-md border border-brand-yellow transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Change product photo from device (Owner)"
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-yellow" />
                  <span>Uploading...</span>
                </>
              ) : photoSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Updated!</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Change Photo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        
        <div className="space-y-2">
          {/* Title */}
          <h3
            onClick={() => onOpenDetails(product)}
            className="text-base font-bold text-deep-charcoal font-heading hover:text-krishna-red transition-colors line-clamp-2 cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Checklist Feature Highlights */}
          {product.features && product.features.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {product.features.slice(0, 2).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-charcoal-muted leading-snug">
                  <div className="w-4 h-4 rounded-full bg-stone-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="line-clamp-2 font-medium">{feat}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
              {product.short_description || product.description}
            </p>
          )}

          {/* Key Nutritional Specs Pills if available */}
          {product.nutritional_info && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.nutritional_info.crude_protein && (
                <span className="text-[11px] bg-krishna-red/10 text-krishna-red font-bold px-2 py-0.5 rounded-md border border-krishna-red/20">
                  Protein: {product.nutritional_info.crude_protein}
                </span>
              )}
              {product.nutritional_info.crude_fat && (
                <span className="text-[11px] bg-brand-yellow/30 text-deep-charcoal font-bold px-2 py-0.5 rounded-md border border-brand-yellow">
                  Fat: {product.nutritional_info.crude_fat}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rate on WhatsApp Info */}
        <div className="pt-2 border-t border-warm-cream-dark">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-bold text-krishna-red bg-krishna-red/10 px-2.5 py-1 rounded-lg border border-krishna-red/20 text-xs">
              <MessageCircle className="w-3.5 h-3.5 text-krishna-red" />
              <span>{t('rateOnWhatsApp')}</span>
            </span>

            <span className="text-[11px] font-bold text-charcoal-muted">
              {product.bag_weight_kg || 50} {t('bagUnit')}
            </span>
          </div>
        </div>

        {/* Error notice if cart limit reached */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          {!isOutOfStock ? (
            <div className="flex items-center gap-2">
              {/* Stepper */}
              <div className="flex items-center border-2 border-warm-cream-dark rounded-xl bg-warm-cream overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-2 text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream-dark disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-black text-xs text-deep-charcoal select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= remainingStock}
                  className="p-2 text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream-dark disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={remainingStock <= 0}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                  isAddedFeedback
                    ? 'bg-emerald-600 text-white'
                    : remainingStock <= 0
                    ? 'bg-warm-cream-dark text-charcoal-muted cursor-not-allowed'
                    : 'bg-brand-yellow hover:bg-brand-yellow-light active:scale-98 text-deep-charcoal border border-brand-yellow-dark'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('addedBtn')}</span>
                  </>
                ) : remainingStock <= 0 ? (
                  <span>{t('maxInCart')}</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-deep-charcoal" />
                    <span>{t('addBagBtn')}{quantity > 1 ? ` (${quantity})` : ''}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-3 rounded-xl bg-warm-cream text-charcoal-muted font-bold text-xs sm:text-sm cursor-not-allowed border border-warm-cream-dark"
            >
              {t('outOfStockText')}
            </button>
          )}

          {/* Quick info link */}
          <button
            type="button"
            onClick={() => onOpenDetails(product)}
            className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-charcoal-muted hover:text-krishna-red py-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-charcoal-muted" />
            <span>{t('viewDetails')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
