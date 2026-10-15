import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { MessageCircle } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const FloatingWhatsAppButton: React.FC = () => {
  const { settings } = useStoreSettings();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    `Namaste ${settings.business_name}, I want to order Radhe Krishna cattle feed bags (Bypass Protein / Ekstrapro) for my dairy farm.`
  )}`;

  return (
    <aside aria-label="WhatsApp Support" className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 no-print">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with owner on WhatsApp"
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white focus:outline-hidden focus:ring-4 focus:ring-emerald-400"
        title="WhatsApp Direct Inquiry"
      >
        {/* Radar ping ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:hidden" />

        <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />

        {/* Desktop Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-deep-charcoal text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity hidden sm:block border border-warm-cream-dark">
          WhatsApp पर संपर्क करें
        </span>
      </a>
    </aside>
  );
};
