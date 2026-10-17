import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { ShieldCheck, Scale, Truck, MessageCircle, Building2, Factory } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const BrandStory: React.FC = () => {
  const { lang, t } = useLanguage();
  const { settings } = useStoreSettings();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const officeAddress = settings.office_address || 'Khasra No. 354/ 1, Patanwa, Industrial area, Ramnagar, Chandauli, ( U. P )';

  const verifiedFacts = [
    {
      icon: Scale,
      title: t('fact1Title'),
      subtitle: t('fact1Sub'),
      desc: t('fact1Desc'),
    },
    {
      icon: ShieldCheck,
      title: t('fact2Title'),
      subtitle: t('fact2Sub'),
      desc: t('fact2Desc'),
    },
    {
      icon: Truck,
      title: t('fact3Title'),
      subtitle: t('fact3Sub'),
      desc: t('fact3Desc'),
    },
    {
      icon: MessageCircle,
      title: t('fact4Title'),
      subtitle: t('fact4Sub'),
      desc: t('fact4Desc'),
    },
  ];

  return (
    <section id="about" className="py-10 sm:py-20 lg:py-24 bg-white border-b border-warm-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Authentic Farm Image with Decorative Frame */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              
              {/* Decorative Frame Underlay with shifting gradient */}
              <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-tr from-krishna-red via-brand-yellow to-feed-turquoise rounded-2xl sm:rounded-3xl opacity-30 animate-gradient-shift transform -rotate-1 blur-xs" />
              
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-warm-cream-dark shadow-xl bg-warm-cream">
                <img
                  src="/images/brand-about.jpg"
                  alt="Woman dairy farmer with Radhe Krishna cattle feed sack and cows"
                  className="w-full h-64 sm:h-96 object-cover object-center group-hover:scale-104 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                
                {/* Brand Badge Overlay on Image */}
                <div className="absolute bottom-4 left-4 right-4 bg-deep-charcoal/90 text-white p-3.5 rounded-2xl backdrop-blur-md border border-brand-yellow/40 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-brand-yellow tracking-wider">
                      KRISHNA AGROVET
                    </span>
                    <span className="block text-sm font-bold text-white">
                      {t('brandName')}
                    </span>
                  </div>
                  <span className="bg-krishna-red text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs animate-pulse">
                    {lang === 'hi' ? 'उच्च गुणवत्ता' : 'PREMIUM FEED'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Brand Introduction & Verified Facts */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-warm-cream border border-warm-cream-dark text-krishna-red text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-krishna-red" />
              <span>{t('aboutBadgeText')}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-deep-charcoal tracking-tight">
                {t('aboutTitle')}
              </h2>
              <p className="text-base sm:text-lg font-bold text-krishna-red font-heading">
                {t('aboutSubtitle')}
              </p>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-charcoal-muted leading-relaxed">
              <p>
                {t('aboutPara1')}
              </p>
              <p>
                {t('aboutPara2')}
              </p>
            </div>

            {/* Verified Facts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {verifiedFacts.map((fact, index) => {
                const Icon = fact.icon;
                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-warm-cream/70 border border-warm-cream-dark flex items-start gap-3 hover:bg-white card-hover-lift transition-all cursor-default group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-warm-cream-dark flex items-center justify-center text-krishna-red shrink-0 shadow-xs group-hover:scale-115 group-hover:rotate-6 group-hover:bg-brand-yellow/30 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-deep-charcoal group-hover:text-krishna-red transition-colors">
                        {fact.title}
                      </h4>
                      <span className="block text-[11px] font-bold text-krishna-red mb-0.5">
                        {fact.subtitle}
                      </span>
                      <p className="text-[11px] text-charcoal-muted leading-tight">
                        {fact.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Registered Office & Mill Information Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-warm-cream/80 border border-warm-cream-dark flex items-start gap-3 card-hover-lift transition-all">
                <Building2 className="w-5 h-5 text-krishna-red shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] font-black text-krishna-red uppercase tracking-wider">
                    {lang === 'hi' ? 'कार्यालय का पता (Office Address)' : 'Registered Office Address'}
                  </span>
                  <p className="text-xs font-semibold text-deep-charcoal leading-relaxed mt-0.5">
                    {officeAddress}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-warm-cream/80 border border-warm-cream-dark flex items-start gap-3 card-hover-lift transition-all">
                <Factory className="w-5 h-5 text-feed-turquoise shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] font-black text-feed-turquoise-dark uppercase tracking-wider">
                    {lang === 'hi' ? 'विनिर्माण मिल (Manufacturing Mill)' : 'Manufacturing Mill Facility'}
                  </span>
                  <p className="text-xs font-semibold text-deep-charcoal leading-relaxed mt-0.5">
                    KRISHNA AGROVET • Ichak, Hazaribagh, Jharkhand - 825402
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-2">
              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                  lang === 'hi'
                    ? `नमस्ते कृष्णा एग्रोवेट, मुझे राधे कृष्णा पशु आहार उत्पादों के बारे में अधिक जानकारी चाहिए।`
                    : `Namaste Krishna Agrovet, I want to know more about Radhe Krishna Pashu Aahar products.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black px-6 py-3.5 rounded-xl text-sm shadow-md glow-amber-hover transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border-2 border-brand-yellow-dark cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-deep-charcoal" />
                <span>{t('aboutCtaWhatsApp')}</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
