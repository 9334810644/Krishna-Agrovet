import React from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Phone, MessageCircle, Truck, Clock, AlertCircle } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const DeliveryCoverage: React.FC = () => {
  const { settings } = useStoreSettings();
  const { t } = useLanguage();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);

  return (
    <section id="delivery" className="py-14 sm:py-20 bg-warm-cream border-b border-warm-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-warm-cream-dark shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-krishna-red bg-warm-cream px-3 py-1 rounded-full border border-warm-cream-dark">
                <Truck className="w-3.5 h-3.5 text-krishna-red" />
                <span>{t('deliveryPill')}</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading tracking-tight">
                {t('deliveryTitle')}
              </h2>

              <p className="text-charcoal-muted text-sm sm:text-base leading-relaxed">
                {t('deliveryPara')}
              </p>

              <div className="bg-warm-cream p-4 rounded-2xl border border-warm-cream-dark space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-krishna-red shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-black text-charcoal-muted uppercase tracking-wider">
                      {t('deliveryActiveCoverage')}
                    </span>
                    <span className="font-bold text-deep-charcoal text-sm sm:text-base">
                      {settings.delivery_areas}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-deep-charcoal font-bold">
                  <Clock className="w-4 h-4 text-feed-turquoise shrink-0" />
                  <span>{t('deliverySameDay')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-deep-charcoal font-bold">
                  <AlertCircle className="w-4 h-4 text-krishna-red shrink-0" />
                  <span>
                    {t('deliveryFreeThreshold').replace('{bags}', String(settings.free_delivery_threshold_bags))}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-krishna-red via-krishna-red-dark to-[#6E0E12] text-white rounded-3xl p-6 sm:p-8 space-y-5 border-2 border-brand-yellow/30 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="bg-brand-yellow text-deep-charcoal text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  KRISHNA AGROVET
                </span>
                <span className="text-xs text-brand-yellow font-bold">50 KG PACKING</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black font-heading text-white">
                {t('deliveryUrgentTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {t('deliveryUrgentDesc')}
              </p>

              <div className="space-y-3 pt-1">
                <a
                  href={`tel:${settings.owner_phone.replace(/\s+/g, '')}`}
                  className="w-full flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black py-3.5 px-4 rounded-xl text-sm transition-colors shadow-md border border-brand-yellow-dark"
                >
                  <Phone className="w-4 h-4 text-deep-charcoal" />
                  <span>{t('deliveryCallBtn')} {settings.owner_phone}</span>
                </a>

                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                    `Namaste ${settings.business_name}, I want urgent cattle feed delivery to my village.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('deliveryMessageBtn')}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
