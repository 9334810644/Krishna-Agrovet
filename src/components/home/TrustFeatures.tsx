import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Truck, ShieldCheck, Banknote, Sparkles, Scale, HeartPulse } from 'lucide-react';

export const TrustFeatures: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: ShieldCheck,
      title: t('trustFeat1Title'),
      desc: t('trustFeat1Desc'),
      color: 'text-krishna-red bg-krishna-red/10 border-krishna-red/20',
    },
    {
      icon: Sparkles,
      title: t('trustFeat2Title'),
      desc: t('trustFeat2Desc'),
      color: 'text-feed-turquoise-dark bg-feed-turquoise/15 border-feed-turquoise/30',
    },
    {
      icon: Scale,
      title: t('trustFeat3Title'),
      desc: t('trustFeat3Desc'),
      color: 'text-deep-charcoal bg-brand-yellow/30 border-brand-yellow',
    },
    {
      icon: Truck,
      title: t('trustFeat4Title'),
      desc: t('trustFeat4Desc'),
      color: 'text-krishna-red bg-krishna-red/10 border-krishna-red/20',
    },
    {
      icon: Banknote,
      title: t('trustFeat5Title'),
      desc: t('trustFeat5Desc'),
      color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
    },
    {
      icon: HeartPulse,
      title: t('trustFeat6Title'),
      desc: t('trustFeat6Desc'),
      color: 'text-amber-800 bg-amber-100 border-amber-200',
    },
  ];

  return (
    <section id="why-us" className="py-14 sm:py-18 bg-white border-b border-warm-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-black text-krishna-red uppercase tracking-widest bg-warm-cream px-3.5 py-1 rounded-full border border-warm-cream-dark">
            {t('trustTag')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-deep-charcoal mt-3 font-heading tracking-tight">
            {t('trustTitle')}
          </h2>
          <p className="text-charcoal-muted text-sm sm:text-base mt-2">
            {t('whyUsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="p-5 sm:p-6 rounded-3xl border-2 border-warm-cream-dark hover:border-brand-yellow card-hover-lift bg-warm-cream/40 hover:bg-white group cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 mb-4 shadow-xs group-hover:scale-110 transition-transform duration-300 ease-out ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-deep-charcoal font-heading mb-1.5 group-hover:text-krishna-red transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
