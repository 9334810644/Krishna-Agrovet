import React from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowDown, MessageCircle, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const Hero: React.FC = () => {
  const { settings } = useStoreSettings();
  const { t } = useLanguage();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);

  const quickWhatsAppUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Namaste ${settings.business_name}, I want to order Radhe Krishna cattle feed bags (Bypass Protein / Ekstrapro) for my dairy farm.`
  )}`;

  return (
    <section className="relative overflow-hidden bg-warm-cream py-10 sm:py-16 lg:py-20 border-b border-warm-cream-dark">
      {/* Background Farm Photography with Warm Sunlight and Tint Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={settings.hero_banner_url || "/images/farm-hero.jpg"}
          alt="Indian rural dairy farm with healthy cows"
          className="w-full h-full object-cover object-center opacity-15 filter saturate-150"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-warm-cream via-warm-cream/90 to-warm-cream/70" />
        <div className="absolute inset-0 bg-[radial-gradient(#F5C900_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-yellow/80 shadow-xs text-krishna-red text-xs sm:text-sm font-bold">
              <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                KRISHNA AGROVET
              </span>
              <span>{t('heroPill')}</span>
            </div>

            {/* Main Title - Selectable HTML as required */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.15] text-deep-charcoal">
                {t('heroHeadline')}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-krishna-red font-heading tracking-tight">
                {t('heroSubline')}
              </p>
            </div>

            {/* Explanatory Paragraph */}
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('heroParagraph')}
            </p>

            {/* Verified Key Value Prop Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-left max-w-xl mx-auto lg:mx-0">
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
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
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
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-charcoal-muted">
              <Truck className="w-4 h-4 shrink-0 text-krishna-red" />
              <span>{t('heroFreeDeliveryNote')}</span>
            </div>
          </div>

          {/* Right Column: Visual Product Showcase Featuring BOTH Real 50kg Bags */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Background Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-brand-yellow/30 via-krishna-red/15 to-feed-turquoise/20 rounded-3xl blur-2xl opacity-75 animate-pulse-glow" />

              {/* Showcase Container with subtle float */}
              <div className="relative bg-white/95 rounded-3xl p-5 sm:p-6 border-2 border-warm-cream-dark shadow-xl backdrop-blur-md animate-float">
                
                {/* Header ribbon in showcase */}
                <div className="flex items-center justify-between pb-4 border-b border-warm-cream-dark">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-krishna-red animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-krishna-red">
                      {t('realPackaging')}
                    </span>
                  </div>
                  <span className="bg-brand-yellow text-deep-charcoal text-[11px] font-black px-2 py-0.5 rounded-md">
                    {t('realProductsCount')}
                  </span>
                </div>

                {/* 2 SACKS DISPLAYED SIDE-BY-SIDE */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 py-4 items-end">
                  
                  {/* Bag 1: Bypass Protein (Red & Yellow) */}
                  <a href="#products" className="group block text-center">
                    <div className="relative aspect-[3/4] bg-gradient-to-b from-warm-cream to-white rounded-2xl p-2 border border-krishna-red/20 shadow-sm group-hover:shadow-md group-hover:scale-102 transition-all overflow-hidden flex items-center justify-center">
                      <img
                        src="/images/products/radhe-krishna-bypass-50kg.svg"
                        alt="Radhe Krishna Bypass Protein Cattle Feed 50kg red and yellow bag"
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                      <div className="absolute top-2 left-2 bg-krishna-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs shadow-xs">
                        50 KG
                      </div>
                    </div>
                    <div className="mt-2 text-left">
                      <span className="block text-[11px] font-bold text-krishna-red truncate">
                        {t('featuredRedTitle')}
                      </span>
                      <span className="block text-[10px] text-charcoal-muted font-medium">
                        {t('featuredRedSub')}
                      </span>
                    </div>
                  </a>

                  {/* Bag 2: Ekstrapro (Turquoise & Yellow) */}
                  <a href="#products" className="group block text-center">
                    <div className="relative aspect-[3/4] bg-gradient-to-b from-warm-cream to-white rounded-2xl p-2 border border-feed-turquoise/20 shadow-sm group-hover:shadow-md group-hover:scale-102 transition-all overflow-hidden flex items-center justify-center">
                      <img
                        src="/images/products/radhe-krishna-ekstrapro-50kg.svg"
                        alt="Radhe Krishna Ekstrapro Cattle Feed 50kg turquoise and yellow bag"
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                      <div className="absolute top-2 left-2 bg-feed-turquoise-dark text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs shadow-xs">
                        50 KG
                      </div>
                    </div>
                    <div className="mt-2 text-left">
                      <span className="block text-[11px] font-bold text-feed-turquoise-dark truncate">
                        {t('featuredTurqTitle')}
                      </span>
                      <span className="block text-[10px] text-charcoal-muted font-medium">
                        {t('featuredTurqSub')}
                      </span>
                    </div>
                  </a>

                </div>

                {/* Bottom Assurance Banner */}
                <div className="pt-3 border-t border-warm-cream-dark flex items-center justify-between text-xs text-charcoal-muted">
                  <div className="flex items-center gap-1.5 font-bold text-deep-charcoal">
                    <ShieldCheck className="w-4 h-4 text-krishna-red" />
                    <span>{t('genuineSacksNote')}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-krishna-red">
                    {t('standard50kg')}
                  </span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
