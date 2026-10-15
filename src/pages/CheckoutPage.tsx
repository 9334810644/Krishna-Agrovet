import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../lib/firebase';
import { CheckoutCustomerData } from '../types';
import { 
  ArrowLeft, ArrowRight, Loader2, 
  AlertCircle, User, CheckCircle2, Camera, UploadCloud, Trash2
} from 'lucide-react';
import { compressDeviceImage } from '../lib/imageCompression';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalBags, totalWeightKg, deliveryFee, clearCart } = useCart();
  const { lang, t } = useLanguage();

  const [formData, setFormData] = useState<CheckoutCustomerData>({
    customer_name: '',
    customer_phone: '',
    village_town: '',
    full_address: '',
    landmark: '',
    pincode: '',
    district: 'Alwar',
    state: 'Rajasthan',
    delivery_notes: '',
    landmark_photo_url: '',
    payment_method: 'cash_on_delivery',
  });

  const landmarkInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleLandmarkPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingPhoto(true);
      setPhotoError(null);
      try {
        const res = await compressDeviceImage(e.target.files[0], 900, 0.85);
        setFormData(prev => ({ ...prev, landmark_photo_url: res.dataUrl }));
      } catch (err: any) {
        setPhotoError(err.message || 'Failed to upload photo from device.');
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey] = useState<string>(() => `rkpa_idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="py-16 bg-warm-cream min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-8 sm:p-12 text-center max-w-md w-full shadow-md space-y-4">
          <div className="w-16 h-16 bg-brand-yellow/30 text-krishna-red rounded-2xl flex items-center justify-center mx-auto border border-brand-yellow">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-heading text-deep-charcoal">{t('cartEmpty')}</h2>
          <p className="text-xs text-charcoal-muted">
            {t('cartEmptyDesc')}
          </p>
          <Link
            to="/#products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black text-xs rounded-xl shadow-xs border-2 border-brand-yellow-dark"
          >
            <span>{t('exploreProductsBtn')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.customer_name.trim()) {
      setErrorMessage('Please enter your full name or farm name (किसान या डेयरी का नाम भरें).');
      return;
    }
    const cleanPhone = formData.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for WhatsApp & delivery coordination (10 अंकों का व्हाट्सएप मोबाइल नंबर भरें).');
      return;
    }
    if (!formData.village_town.trim()) {
      setErrorMessage('Please specify your Village, Gram Panchayat, or Town (गांव या ग्राम पंचायत का नाम लिखें).');
      return;
    }
    if (!formData.full_address.trim()) {
      setErrorMessage('Please enter your full delivery address (e.g. Near Mandi, Gaushala Road).');
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit postal PIN code (6 अंकों का पिन कोड भरें).');
      return;
    }

    setSubmitting(true);

    try {
      // Build RPC items payload
      const orderItemsPayload = items.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      // Call Atomic Order placement RPC
      const result = await dataService.placeOrderAtomic(formData, orderItemsPayload, idempotencyKey);

      if (result.success && result.order_number) {
        // Fetch created order to ensure full snapshot is available for confirmation screen
        const createdOrder = await dataService.getOrderByNumber(result.order_number);
        
        // Clear customer cart
        clearCart();

        // Navigate to confirmation page
        navigate(`/order-confirmation/${result.order_number}`, {
          state: { order: createdOrder || { ...result, ...formData, items } },
          replace: true,
        });
      } else {
        setErrorMessage(result.message || 'Could not place order. Please review your items and try again.');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'An error occurred while creating your order. Please check stock and try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 lg:py-16 bg-warm-cream min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation link back to cart */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-deep-charcoal hover:text-krishna-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-krishna-red" />
            <span>Back to Cart ({totalBags} bags)</span>
          </Link>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-krishna-red uppercase tracking-wider mb-1">
            <span>RADHE KRISHNA PASHU AAHAR • KRISHNA AGROVET</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-deep-charcoal font-heading">
            {t('checkoutTitle')}
          </h1>
          <p className="text-charcoal-muted text-sm mt-1">
            {t('checkoutSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="font-bold">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Fields Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-warm-cream-dark p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="border-b border-warm-cream-dark pb-3 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black font-heading text-deep-charcoal flex items-center gap-2">
                  <User className="w-5 h-5 text-krishna-red" />
                  <span>Customer & Delivery Details</span>
                </h2>
                <span className="text-[11px] font-bold text-krishna-red bg-warm-cream px-2.5 py-1 rounded-md">
                  Step 1 of 2
                </span>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label htmlFor="customer_name" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                  {t('nameLabel')} *
                </label>
                <input
                  id="customer_name"
                  type="text"
                  name="customer_name"
                  required
                  placeholder={t('namePlaceholder')}
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-medium"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-1.5">
                <label htmlFor="customer_phone" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                  {t('phoneLabel')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-deep-charcoal select-none">
                    +91
                  </span>
                  <input
                    id="customer_phone"
                    type="tel"
                    name="customer_phone"
                    required
                    maxLength={10}
                    placeholder={t('phonePlaceholder')}
                    value={formData.customer_phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-mono font-bold"
                  />
                </div>
                <span className="text-[11px] text-charcoal-muted font-medium">
                  We send dispatch timing and driver contact on this WhatsApp number.
                </span>
              </div>

              {/* Village / Town */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="village_town" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                    {t('villageLabel')} *
                  </label>
                  <input
                    id="village_town"
                    type="text"
                    name="village_town"
                    required
                    placeholder={t('villagePlaceholder')}
                    value={formData.village_town}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="landmark" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                    {t('landmarkLabel')}
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    name="landmark"
                    placeholder={t('landmarkPlaceholder')}
                    value={formData.landmark || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-medium"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1.5">
                <label htmlFor="full_address" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                  {t('addressLabel')} *
                </label>
                <textarea
                  id="full_address"
                  name="full_address"
                  required
                  rows={2}
                  placeholder={t('addressPlaceholder')}
                  value={formData.full_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-medium"
                />
              </div>

              {/* PIN Code & District */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="pincode" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                    {t('pinLabel')} *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    placeholder={t('pinPlaceholder')}
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="district" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                    {t('districtLabel')}
                  </label>
                  <input
                    id="district"
                    type="text"
                    name="district"
                    value={formData.district || 'Alwar'}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark rounded-xl text-sm text-deep-charcoal font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="state" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                    {t('stateLabel')}
                  </label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={formData.state || 'Rajasthan'}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark rounded-xl text-sm text-deep-charcoal font-medium"
                  />
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="space-y-1.5">
                <label htmlFor="delivery_notes" className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                  {t('notesLabel')}
                </label>
                <input
                  id="delivery_notes"
                  type="text"
                  name="delivery_notes"
                  placeholder={t('notesPlaceholder')}
                  value={formData.delivery_notes || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-warm-cream border-2 border-warm-cream-dark focus:border-krishna-red rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:ring-2 focus:ring-krishna-red/20 font-medium"
                />
              </div>

              {/* Farm Gate / Landmark Photo Upload from Device (Optional) */}
              <div className="space-y-2 pt-2 border-t border-warm-cream-dark">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-deep-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-krishna-red" />
                    <span>{lang === 'hi' ? 'डेयरी / फार्म गेट की फोटो (वैकल्पिक)' : 'Farm Gate / Landmark Photo (Optional)'}</span>
                  </label>
                  <span className="text-[11px] text-charcoal-muted font-bold">
                    {lang === 'hi' ? 'डिवाइस से अपलोड करें' : 'Upload from Device'}
                  </span>
                </div>

                <p className="text-[11px] text-charcoal-muted leading-relaxed">
                  {lang === 'hi'
                    ? 'अपने फार्म शेड, गेट या रास्ते के मोड़ की फोटो अपलोड करें ताकि टेम्पो ड्राइवर आपके बाड़े तक आसानी से पहुंच सके।'
                    : 'Attach a photo of your farm shed or landmark to help our tempo delivery driver reach your exact location.'}
                </p>

                <input
                  ref={landmarkInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLandmarkPhotoChange}
                  className="hidden"
                />

                {photoError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}

                {!formData.landmark_photo_url ? (
                  <button
                    type="button"
                    onClick={() => landmarkInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-4 px-4 border-2 border-dashed border-warm-cream-dark hover:border-krishna-red bg-warm-cream/40 hover:bg-warm-cream rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer"
                  >
                    {isProcessingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-krishna-red" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-krishna-red" />
                    )}
                    <span className="text-xs font-black text-deep-charcoal">
                      {isProcessingPhoto
                        ? (lang === 'hi' ? 'फोटो कंप्रेस हो रही है...' : 'Optimizing photo...')
                        : (lang === 'hi' ? 'डिवाइस से फोटो चुनें या कैमरा खोलें' : 'Choose Photo from Device / Open Camera')}
                    </span>
                    <span className="text-[10px] text-charcoal-muted">
                      JPG, PNG, WebP (Camera or Photo Gallery)
                    </span>
                  </button>
                ) : (
                  <div className="relative rounded-2xl border-2 border-warm-cream-dark bg-warm-cream/50 p-3 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-black/10 overflow-hidden shrink-0 border border-warm-cream-dark flex items-center justify-center">
                      <img
                        src={formData.landmark_photo_url}
                        alt="Uploaded farm landmark"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-black text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'hi' ? 'फार्म फोटो संलग्न है' : 'Farm Photo Attached'}</span>
                      </span>
                      <span className="text-[11px] text-charcoal-muted block truncate">
                        {lang === 'hi' ? 'ड्राइवर के लिए सुरक्षित' : 'Saved for driver coordination'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, landmark_photo_url: '' }))}
                      className="p-2 text-charcoal-muted hover:text-rose-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <label className="block text-xs font-black text-deep-charcoal uppercase tracking-wider mb-2">
                  {t('paymentLabel')}
                </label>
                <div className="p-4 bg-warm-cream border-2 border-brand-yellow rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-krishna-red flex items-center justify-center text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-deep-charcoal">
                        {t('codText')}
                      </span>
                      <span className="block text-xs text-charcoal-muted">
                        Pay cash directly to our delivery tempo driver after inspecting bags.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-krishna-red bg-white px-2.5 py-1 rounded-md border border-warm-cream-dark">
                    COD
                  </span>
                </div>
              </div>

            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 shadow-md space-y-4 sticky top-24">
                <h3 className="text-lg font-black font-heading text-deep-charcoal border-b border-warm-cream-dark pb-3">
                  Order Bags Summary
                </h3>

                {/* Items brief list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded-lg bg-warm-cream p-0.5 border border-warm-cream-dark shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-deep-charcoal block truncate">
                            {product.name}
                          </span>
                          <span className="text-charcoal-muted text-[11px]">
                            {quantity} × {product.bag_weight_kg || 50}kg bag
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-krishna-red bg-krishna-red/10 px-2 py-0.5 rounded">
                          Rate on WhatsApp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-warm-cream-dark space-y-2 text-xs font-bold text-charcoal-muted">
                  <div className="flex justify-between">
                    <span>{t('totalSacks')}:</span>
                    <span className="font-black text-deep-charcoal">{totalBags} {t('bagsCount')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('totalNetWeight')}:</span>
                    <span className="font-black text-deep-charcoal">{totalWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('deliveryCharges')}:</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-700 font-black' : 'text-deep-charcoal font-black'}>
                      {deliveryFee === 0 ? t('freeText') : 'Doorstep Farm Delivery'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-warm-cream-dark text-xs sm:text-sm font-black text-deep-charcoal">
                    <span>कीमत / Pricing:</span>
                    <span className="text-krishna-red font-heading font-black">
                      व्हाट्सएप पर चर्चा / Rate on WhatsApp
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-brand-yellow hover:bg-brand-yellow-light disabled:opacity-50 text-deep-charcoal font-black text-base rounded-2xl shadow-md transition-all active:scale-98 border-2 border-brand-yellow-dark cursor-pointer mt-4"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving Order in System...</span>
                    </>
                  ) : (
                    <>
                      <span>{t('submitOrderBtn')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-charcoal-muted text-center leading-relaxed">
                  {t('orderSavingNote')}
                </p>

              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};
