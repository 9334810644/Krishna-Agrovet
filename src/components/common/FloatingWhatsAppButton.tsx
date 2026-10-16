import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { MessageCircle } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const FloatingWhatsAppButton: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang } = useLanguage();
  const { totalBags } = useCart();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${settings.business_name}, मुझे अपनी डेयरी फार्म के लिए राधे कृष्णा पशु आहार (बाईपास प्रोटीन / एक्स्ट्राप्रो) की बोरियां ऑर्डर करनी हैं।`
      : `Namaste ${settings.business_name}, I want to order Radhe Krishna cattle feed bags (Bypass Protein / Ekstrapro) for my dairy farm.`
  )}`;

  const isCartBarVisible = totalBags > 0 && location.pathname !== '/cart' && location.pathname !== '/checkout';
  const bottomClass = isCartBarVisible ? 'bottom-20 sm:bottom-6' : 'bottom-5 sm:bottom-6';

  return (
    <aside aria-label="WhatsApp Support" className={`fixed ${bottomClass} right-4 sm:right-6 z-40 no-print transition-all duration-300 animate-float`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with owner on WhatsApp"
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl hover:shadow-2xl glow-green-hover hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white focus:outline-hidden focus:ring-4 focus:ring-emerald-400"
        title="WhatsApp Direct Inquiry"
      >
        {/* Multi-layer Radar ping wave */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping group-hover:hidden" />
        <span className="absolute -inset-2 rounded-full bg-[#25D366] opacity-20 animate-pulse-glow pointer-events-none" />

        <MessageCircle className="w-7 h-7 fill-white text-[#25D366] group-hover:scale-110 transition-transform duration-200" />

        {/* Desktop Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-deep-charcoal text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 hidden sm:block border border-warm-cream-dark">
          {lang === 'hi' ? 'WhatsApp पर संपर्क करें' : 'Chat on WhatsApp'}
        </span>
      </a>
    </aside>
  );
};
