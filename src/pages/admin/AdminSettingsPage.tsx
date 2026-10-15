import React, { useState, useRef } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { Save, Loader2, Check, AlertCircle, Camera, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { compressDeviceImage } from '../../lib/imageCompression';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useStoreSettings();
  
  const [formData, setFormData] = useState({
    business_name: settings.business_name,
    tagline: settings.tagline,
    owner_whatsapp: settings.owner_whatsapp,
    owner_phone: settings.owner_phone,
    support_email: settings.support_email,
    delivery_areas: settings.delivery_areas,
    min_order_bags: settings.min_order_bags || 1,
    delivery_fee_per_bag: settings.delivery_fee_per_bag || 30,
    free_delivery_threshold_bags: settings.free_delivery_threshold_bags || 5,
    notice_banner_text: settings.notice_banner_text,
    is_store_open: settings.is_store_open,
    logo_url: settings.logo_url || '/images/krishna-agrovet-logo.png',
    hero_banner_url: settings.hero_banner_url || '',
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [processingLogo, setProcessingLogo] = useState<boolean>(false);
  const [processingBanner, setProcessingBanner] = useState<boolean>(false);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProcessingLogo(true);
      setBrandingError(null);
      try {
        const res = await compressDeviceImage(e.target.files[0], 400, 0.9);
        setFormData(prev => ({ ...prev, logo_url: res.dataUrl }));
      } catch (err: any) {
        setBrandingError(err.message || 'Failed to upload logo.');
      } finally {
        setProcessingLogo(false);
      }
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProcessingBanner(true);
      setBrandingError(null);
      try {
        const res = await compressDeviceImage(e.target.files[0], 1200, 0.85);
        setFormData(prev => ({ ...prev, hero_banner_url: res.dataUrl }));
      } catch (err: any) {
        setBrandingError(err.message || 'Failed to upload banner.');
      } finally {
        setProcessingBanner(false);
      }
    }
  };

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      await updateSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Error updating store settings:', err);
      setErrorMsg(err.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            KRISHNA AGROVET
          </span>
          <span className="text-xs font-bold text-charcoal-muted">Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
          Store Configuration & Contact Info
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
          Update business identity, owner WhatsApp click-to-chat numbers, and village delivery areas.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-700" />
          <span>Store settings saved successfully across storefront and database!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 sm:p-8 shadow-sm space-y-6 text-xs">
        
        {/* Business Identity */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-deep-charcoal font-heading border-b border-warm-cream-dark pb-3">
            Business Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Business / Store Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-bold text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Business Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-medium text-deep-charcoal"
              />
            </div>
          </div>

          {/* Store Logo & Hero Banner Images Upload */}
          <div className="space-y-4 pt-4 border-t border-warm-cream-dark">
            <div>
              <h3 className="text-sm font-black text-deep-charcoal font-heading">
                Store Branding & Photos (दुकान का लोगो और बैनर फोटो)
              </h3>
              <p className="text-charcoal-muted text-[11px] mt-0.5">
                Upload logo and background banner directly from your phone camera or gallery. Photos are automatically compressed for ultra-fast loading.
              </p>
            </div>

            {brandingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{brandingError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Logo Upload */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-warm-cream-dark bg-warm-cream/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-deep-charcoal block">Store Logo / Emblem (दुकान का लोगो)</span>
                    <span className="text-[10px] text-charcoal-muted">Shown in header & navigation</span>
                  </div>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />

                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative group shrink-0">
                      <img
                        src={formData.logo_url}
                        alt="Store Logo Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-yellow shadow-md"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Preview
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-warm-cream border-2 border-warm-cream-dark flex flex-col items-center justify-center text-charcoal-muted shrink-0">
                      <Camera className="w-5 h-5 text-charcoal-muted/60 mb-0.5" />
                      <span className="text-[9px] font-bold">No Logo</span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      disabled={processingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-warm-cream-dark hover:border-krishna-red text-deep-charcoal font-bold text-xs shadow-xs hover:bg-warm-cream transition-all cursor-pointer"
                    >
                      {processingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-krishna-red" />
                          <span>Compressing...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-krishna-red" />
                          <span>{formData.logo_url ? 'Change Logo Photo' : 'Upload from Device'}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-charcoal-muted leading-tight">
                      Pick image from phone gallery or take photo with camera.
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Hero Banner Upload */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-warm-cream-dark bg-warm-cream/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-deep-charcoal block">Hero Banner Photo (मुख्य बैनर)</span>
                    <span className="text-[10px] text-charcoal-muted">Shown in website hero backdrop</span>
                  </div>
                  {formData.hero_banner_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, hero_banner_url: '' }))}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBannerFileChange}
                />

                <div className="space-y-2">
                  {formData.hero_banner_url ? (
                    <div className="relative group rounded-xl overflow-hidden border-2 border-brand-yellow shadow-xs h-20 w-full">
                      <img
                        src={formData.hero_banner_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Banner Preview
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 rounded-xl bg-warm-cream border-2 border-warm-cream-dark flex items-center justify-center gap-2 text-charcoal-muted">
                      <ImageIcon className="w-4 h-4 text-charcoal-muted/60" />
                      <span className="text-[11px] font-bold">Default Farm Photo Active</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={processingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-warm-cream-dark hover:border-krishna-red text-deep-charcoal font-bold text-xs shadow-xs hover:bg-warm-cream transition-all cursor-pointer"
                  >
                    {processingBanner ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-krishna-red" />
                        <span>Compressing...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-krishna-red" />
                        <span>{formData.hero_banner_url ? 'Change Banner Photo' : 'Upload Banner from Device'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Contact */}
        <div className="space-y-4 pt-2 border-t border-warm-cream-dark">
          <h2 className="text-base font-black text-deep-charcoal font-heading border-b border-warm-cream-dark pb-3">
            Owner WhatsApp & Telephone
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Owner WhatsApp (Digits only) *</label>
              <input
                type="text"
                required
                placeholder="919876543210"
                value={formData.owner_whatsapp}
                onChange={(e) => setFormData({ ...formData, owner_whatsapp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-mono font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Display Telephone *</label>
              <input
                type="text"
                required
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Support Email</label>
              <input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>
          </div>
        </div>

        {/* Delivery Rules */}
        <div className="space-y-4 pt-2 border-t border-warm-cream-dark">
          <h2 className="text-base font-black text-deep-charcoal font-heading border-b border-warm-cream-dark pb-3">
            Farm Delivery Settings
          </h2>

          <div className="space-y-1">
            <label className="font-bold text-deep-charcoal">Covered Villages / Tehsils *</label>
            <textarea
              rows={2}
              required
              value={formData.delivery_areas}
              onChange={(e) => setFormData({ ...formData, delivery_areas: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-medium text-deep-charcoal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Free Delivery Threshold (bags) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.free_delivery_threshold_bags}
                onChange={(e) => setFormData({ ...formData, free_delivery_threshold_bags: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-black focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Delivery Fee / Bag (if under threshold)</label>
              <input
                type="number"
                min="0"
                value={formData.delivery_fee_per_bag}
                onChange={(e) => setFormData({ ...formData, delivery_fee_per_bag: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-black focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Min Order (bags)</label>
              <input
                type="number"
                min="1"
                value={formData.min_order_bags}
                onChange={(e) => setFormData({ ...formData, min_order_bags: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="space-y-1 pt-2 border-t border-warm-cream-dark">
          <label className="font-bold text-deep-charcoal">Top Notice / Delivery Banner Text</label>
          <input
            type="text"
            value={formData.notice_banner_text}
            onChange={(e) => setFormData({ ...formData, notice_banner_text: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-medium text-deep-charcoal"
          />
        </div>

        <div className="pt-4 border-t border-warm-cream-dark flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl shadow-md transition-colors border-2 border-brand-yellow-dark cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Configuration</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
