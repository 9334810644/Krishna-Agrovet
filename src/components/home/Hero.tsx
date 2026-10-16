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
    <section className="relative overflow-hidden bg-warm-cream py-10 sm:py-14 lg:py-16 border-b border-warm-cream-dark">
      {/* Background Farm Photography with Warm Sunlight and Tint Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/farm-hero.jpg"
          alt="Indian rural dairy farm with healthy cows"
          className="w-full h-full object-cover object-center opacity-15 filter saturate-150 scale-102 transition-transform duration-1000"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-warm-cream via-warm-cream/90 to-warm-cream/75" />
        <div className="absolute inset-0 bg-[radial-gradient(#F5C900_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        {/* Ambient Animated Glowing Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-yellow/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-krishna-red/15 rounded-full blur-3xl animate-pulse-glow [animation-delay:1.5s]" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-feed-turquoise/15 rounded-full blur-3xl animate-pulse-glow [animation-delay:3s]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Live Farm Fresh Supply Beacon Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-brand-yellow/60 shadow-xs backdrop-blur-xs animate-float-slow">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-deep-charcoal">
              {lang === 'hi'
                ? '🌾 सीधे मिल से ताज़ा आपूर्ति • प्रामाणिक बोरियां • टेम्पो डिलीवरी'
                : '🌾 Direct Mill Fresh Supply • 100% Genuine Sacks • Tempo Delivery'}
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.18] sm:leading-[1.15] text-deep-charcoal">
              {t('heroHeadline')}
            </h1>
            <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-krishna-red font-heading tracking-tight">
              {t('heroSubline')}
            </p>
          </div>

          {/* Explanatory Paragraph */}
          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed max-w-2xl mx-auto">
            {t('heroParagraph')}
          </p>

          {/* Verified Key Value Prop Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 bg-white/95 p-3.5 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift group">
              <div className="p-2 rounded-xl bg-krishna-red/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <CheckCircle2 className="w-5 h-5 text-krishna-red shrink-0" />
              </div>
              <div>
                <span className="block text-xs font-bold text-deep-charcoal">{t('heroBenefit1')}</span>
                <span className="block text-[10px] text-charcoal-muted">Bypass & Ekstrapro</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/95 p-3.5 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift group">
              <div className="p-2 rounded-xl bg-brand-yellow/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-brand-yellow-dark shrink-0" />
              </div>
              <div>
                <span className="block text-xs font-bold text-deep-charcoal">{t('heroBenefit2')}</span>
                <span className="block text-[10px] text-charcoal-muted">High Butterfat Test</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/95 p-3.5 rounded-2xl border border-warm-cream-dark shadow-xs card-hover-lift group">
              <div className="p-2 rounded-xl bg-feed-turquoise/15 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Truck className="w-5 h-5 text-feed-turquoise shrink-0" />
              </div>
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black px-7 py-4 rounded-2xl text-base shadow-md glow-amber-hover border-2 border-brand-yellow-dark cursor-pointer transition-all duration-300"
            >
              <span>{t('heroCtaPrimary')}</span>
              <ArrowDown className="w-4 h-4 text-deep-charcoal animate-bounce" />
            </a>

            <a
              href={quickWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-6 py-4 rounded-2xl text-base shadow-md glow-green-hover cursor-pointer transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('heroCtaWhatsApp')}</span>
            </a>
          </div>

          {/* Farm delivery note */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-charcoal-muted">
            <Truck className="w-4 h-4 shrink-0 text-krishna-red animate-pulse" />
            <span>{t('heroFreeDeliveryNote')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
