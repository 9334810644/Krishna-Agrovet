import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { Phone, MessageCircle, MapPin, Mail, ShieldCheck, Truck, Clock, Factory, Building2 } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const Footer: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang, t } = useLanguage();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);

  const officeAddress = settings.office_address || 'Khasra No. 354/ 1, Patanwa, Industrial area, Ramnagar, Chandauli, ( U. P )';

  return (
    <footer className="bg-deep-charcoal text-stone-300 pt-14 pb-10 border-t-4 border-brand-yellow no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-10 mb-12">
          
          {/* Col 1: About Business */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.business_name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain bg-white p-1 border-2 border-brand-yellow shadow-md shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-krishna-red to-krishna-red-dark flex items-center justify-center text-brand-yellow font-black border border-brand-yellow shrink-0">
                  RK
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/radhe-krishna-transparent-wordmark.png"
                  alt="राधे कृष्णा पशु आहार"
                  className="h-9 sm:h-12 w-auto max-w-[130px] sm:max-w-none object-contain filter brightness-105 drop-shadow-sm shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase tracking-wider font-heading">
                    KRISHNA AGROVET
                  </span>
                  <span className="text-[10px] font-bold text-brand-yellow uppercase tracking-wider">
                    {t('brandSub')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              {t('footerDesc')}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-brand-yellow bg-black/30 p-2.5 rounded-xl border border-brand-yellow/30 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-brand-yellow" />
              <span>{t('footerGenuineAssurance')}</span>
            </div>
          </div>

          {/* Col 2: Delivery & Mill Info */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4 font-heading border-b border-stone-800 pb-2">
              {t('footerDispatch')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <span>
                  <strong>{t('footerDoorstepTitle')}</strong> {t('footerDoorstepDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <span>
                  <strong>{t('footerDispatchSchedTitle')}</strong> {t('footerDispatchSchedDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Factory className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-xs">{t('footerManufacturingTitle')}</strong>
                  <span className="text-xs text-stone-400">
                    KRISHNA AGROVET • Ichak, Hazaribagh, Jharkhand - 825402
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <span className="text-xs text-stone-400">
                  {settings.delivery_areas}
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Office Address */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4 font-heading border-b border-stone-800 pb-2">
              {t('footerContact')}
            </h3>
            <p className="text-xs text-stone-400">
              {lang === 'hi'
                ? 'थोक भाव, 20+ बोरियों के ऑर्डर या तत्काल फार्म डिलीवरी के लिए:'
                : 'For wholesale rates, bulk orders (20+ bags), or urgent farm deliveries:'}
            </p>
            <div className="space-y-2.5 pt-1 text-sm">
              <a
                href={`tel:${settings.owner_phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors font-bold"
              >
                <Phone className="w-4 h-4 text-brand-yellow" />
                <span>{settings.owner_phone}</span>
              </a>
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-yellow hover:text-white font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{lang === 'hi' ? 'व्हाट्सएप पर संपर्क' : 'WhatsApp Owner Direct'}</span>
              </a>
              <a
                href={`mailto:${settings.support_email}`}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-300 text-xs transition-colors"
              >
                <Mail className="w-4 h-4 text-stone-500" />
                <span className="truncate">{settings.support_email}</span>
              </a>
            </div>

            {/* Office Address Card */}
            <div className="pt-2.5 border-t border-stone-800 flex items-start gap-2 text-xs">
              <Building2 className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-brand-yellow text-[11px] uppercase tracking-wider">
                  {t('footerOfficeAddressTitle')}
                </span>
                <span className="text-stone-300 leading-relaxed block mt-0.5 font-medium">
                  {officeAddress}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} {t('brandName')} • {t('manufacturerText')}. {t('footerRights')}
          </p>
          <div className="flex items-center gap-6">
            <a href="/#products" className="hover:text-stone-400 transition-colors">
              {t('navProducts')}
            </a>
            <a href="/#about" className="hover:text-stone-400 transition-colors">
              {t('navAbout')}
            </a>
            <a href="/#faq" className="hover:text-stone-400 transition-colors">
              {lang === 'hi' ? 'अक्सर पूछे सवाल (FAQ)' : 'FAQ'}
            </a>
            <Link to="/admin/login" className="hover:text-stone-400 transition-colors text-[11px]">
              {t('navAdmin')}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
