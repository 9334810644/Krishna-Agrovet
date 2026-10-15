import React from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowDown, MessageCircle, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const Hero: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang, t } = useLanguage();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);

  const quickWhatsAppUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${settings.business_name}, मुझे अपनी डेयरी फार्म के लिए राधे कृष्णा पशु आहार (बाईपास प्रोटीन / एक्स्ट्राप्रो) की बोरियां ऑर्डर करनी हैं।`
      : `Namaste ${settings.business_name}, I want to order Radhe Krishna cattle feed bags (Bypass Protein / Ekstrapro) for my dairy farm.`
  )}`;

  return (
    <section className="relative overflow-hidden bg-warm-cream py-8 sm:py-12 lg:py-14 border-b border-warm-cream-dark">
      {/* Background Farm Photography with Warm Sunlight and Tint Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/farm-hero.jpg"
          alt="Indian rural dairy farm with healthy cows"
          className="w-full h-full object-cover object-center opacity-15 filter saturate-150"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-warm-cream via-warm-cream/90 to-warm-cream/70" />
        <div className="absolute inset-0 bg-[radial-gradient(#F5C900_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.15] text-deep-charcoal">
              {t('heroHeadline')}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-krishna-red font-heading tracking-tight">
              {t('heroSubline')}
            </p>
          </div>

          {/* Explanatory Paragraph */}
          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed max-w-2xl mx-auto">
            {t('heroParagraph')}
          </p>

          {/* Verified Key Value Prop Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift">
              <CheckCircle2 className="w-5 h-5 text-krishna-red shrink-0" />
              <div>
                <span className="block text-xs font-bold text-deep-charcoal">{t('heroBenefit1')}</span>
                <span className="block text-[10px] text-charcoal-muted">Bypass & Ekstrapro</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift">
              <Sparkles className="w-5 h-5 text-brand-yellow-dark shrink-0" />
              <div>
                <span className="block text-xs font-bold text-deep-charcoal">{t('heroBenefit2')}</span>
                <span className="block text-[10px] text-charcoal-muted">High Butterfat Test</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift">
              <Truck className="w-5 h-5 text-feed-turquoise shrink-0" />
              <div>
                <span className="block text-xs font-bold text-deep-charcoal">{t('heroBenefit3')}</span>
                <span className="block text-[10px] text-charcoal-muted">Doorstep Unloading</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <a
              href="#products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black px-7 py-4 rounded-2xl text-base shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border-2 border-brand-yellow-dark cursor-pointer"
            >
              <span>{t('heroCtaPrimary')}</span>
              <ArrowDown className="w-4 h-4 text-deep-charcoal animate-bounce" />
            </a>

            <a
              href={quickWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-6 py-4 rounded-2xl text-base shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('heroCtaWhatsApp')}</span>
            </a>
          </div>

          {/* Farm delivery note */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-charcoal-muted">
            <Truck className="w-4 h-4 shrink-0 text-krishna-red" />
            <span>{t('heroFreeDeliveryNote')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
