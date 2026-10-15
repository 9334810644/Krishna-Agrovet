import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShoppingBag, Phone, Menu, X, Shield, 
  MessageCircle, ChevronRight
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

interface HeaderProps {
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const { totalBags } = useCart();
  const { settings } = useStoreSettings();
  const { isAdmin } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanWhatsAppNumber = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const quickWhatsAppUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    `Namaste ${settings.business_name}, I want to inquire about Radhe Krishna cattle feed (Bypass Protein / Ekstrapro) bags availability and delivery to my farm.`
  )}`;

  const navLinks = [
    { label: t('navProducts'), href: '/#products' },
    { label: t('navAbout'), href: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-cream-dark shadow-xs no-print transition-all">
      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-3">
          
          {/* Logo & Brand Identity */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 group focus:outline-hidden focus:ring-2 focus:ring-krishna-red rounded-xl p-1"
          >
            {/* Logo Emblem: Custom uploaded logo or Krishna Red & Brand Yellow with cow/wheat iconography */}
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.business_name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-white p-1 shadow-md border-2 border-brand-yellow group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-krishna-red via-krishna-red-dark to-[#6A0E12] flex items-center justify-center text-brand-yellow shadow-md border-2 border-brand-yellow group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 32 32" fill="none">
                  {/* Stylized Indian Cattle Horns & Butter Pot Silhouette */}
                  <path d="M 8 10 C 6 6, 8 3, 10 3 C 12 5, 11 9, 13 13" stroke="#F5C900" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 24 10 C 26 6, 24 3, 22 3 C 20 5, 21 9, 19 13" stroke="#F5C900" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="16" cy="18" r="9" fill="#F5C900" />
                  <path d="M 12 18 Q 16 14 20 18 Q 16 23 12 18 Z" fill="#B82025" />
                  <circle cx="16" cy="18" r="2" fill="#FFFFFF" />
                </svg>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5">
              <img
                src="/images/radhe-krishna-transparent-wordmark.png"
                alt="राधे कृष्णा पशु आहार"
                className="h-11 sm:h-13 md:h-15 w-auto object-contain filter drop-shadow-xs group-hover:scale-102 transition-transform shrink-0"
              />
              <div className="hidden lg:flex flex-col border-l border-warm-cream-dark pl-2.5 justify-center">
                <span className="text-[12px] font-black text-deep-charcoal tracking-wide uppercase font-heading leading-tight">
                  KRISHNA AGROVET
                </span>
                <span className="text-[9px] font-bold text-krishna-red uppercase tracking-wider leading-tight">
                  50 KG SACKS • BYPASS PROTEIN
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream"
              >
                <span>{link.label}</span>
              </a>
            ))}

            {/* Quick WhatsApp Inquiry */}
            <a
              href={quickWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 lg:px-3 py-2 text-xs lg:text-sm font-bold text-feed-turquoise-dark hover:text-feed-turquoise hover:bg-warm-cream rounded-xl transition-colors"
              title="Chat with owner on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-feed-turquoise" />
              <span>{t('navWhatsApp')}</span>
            </a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Bilingual Segmented Language Switcher */}
            <div className="inline-flex items-center rounded-xl bg-warm-cream p-1 border border-warm-cream-dark shadow-2xs">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-krishna-red text-white shadow-xs font-black'
                    : 'text-charcoal-muted hover:text-deep-charcoal'
                }`}
                title="हिन्दी"
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-krishna-red text-white shadow-xs font-black'
                    : 'text-charcoal-muted hover:text-deep-charcoal'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Admin shortcut button */}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-charcoal-muted hover:text-krishna-red hover:bg-warm-cream rounded-xl transition-colors flex items-center gap-1"
              title={isAdmin ? 'Admin Dashboard' : 'Admin Portal Login'}
            >
              <Shield className="w-4 h-4 text-charcoal-muted" />
              <span className="hidden xl:inline">{isAdmin ? 'Admin Panel' : t('navAdmin')}</span>
            </Link>

            {/* Shopping Cart Button */}
            {onOpenCart ? (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center gap-2 bg-krishna-red hover:bg-krishna-red-dark active:scale-98 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2"
                aria-label={`View shopping cart with ${totalBags} bags`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow" />
                <span className="hidden sm:inline">{t('cartBtn')}</span>
                {totalBags > 0 && (
                  <span className="bg-brand-yellow text-deep-charcoal font-black text-xs px-2 py-0.5 rounded-full ml-0.5 shadow-xs">
                    {totalBags} <span className="hidden md:inline font-bold text-[10px]">{t('bagsCount')}</span>
                  </span>
                )}
              </button>
            ) : (
              <Link
                to="/cart"
                className="relative flex items-center gap-2 bg-krishna-red hover:bg-krishna-red-dark text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow" />
                <span className="hidden sm:inline">{t('cartBtn')}</span>
                {totalBags > 0 && (
                  <span className="bg-brand-yellow text-deep-charcoal font-black text-xs px-2 py-0.5 rounded-full ml-0.5">
                    {totalBags}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream rounded-xl"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-warm-cream-dark px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-bold text-deep-charcoal hover:bg-warm-cream hover:text-krishna-red transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-charcoal-muted" />
              </a>
            ))}
          </div>

          {/* Mobile Language Switcher Row */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between p-2 bg-warm-cream rounded-xl border border-warm-cream-dark">
              <span className="text-xs font-bold text-charcoal-muted">Language / भाषा:</span>
              <div className="inline-flex items-center rounded-lg bg-white p-0.5 border border-warm-cream-dark shadow-2xs">
                <button
                  type="button"
                  onClick={() => { setLang('hi'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                    lang === 'hi'
                      ? 'bg-krishna-red text-white shadow-xs font-black'
                      : 'text-charcoal-muted hover:text-deep-charcoal'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => { setLang('en'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                    lang === 'en'
                      ? 'bg-krishna-red text-white shadow-xs font-black'
                      : 'text-charcoal-muted hover:text-deep-charcoal'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-warm-cream-dark space-y-2">
            <a
              href={`tel:${settings.owner_phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-warm-cream rounded-xl text-deep-charcoal font-bold text-sm"
            >
              <Phone className="w-4 h-4 text-krishna-red" />
              <span>{settings.owner_phone}</span>
            </a>
            <a
              href={quickWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-feed-turquoise/15 text-feed-turquoise-dark rounded-xl font-bold text-sm"
            >
              <MessageCircle className="w-4 h-4 text-feed-turquoise" />
              <span>{t('navWhatsApp')}</span>
            </a>
          </div>

          <div className="pt-2">
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-charcoal-muted border border-warm-cream-dark rounded-xl hover:bg-warm-cream"
            >
              <Shield className="w-3.5 h-3.5 text-charcoal-muted" />
              <span>{isAdmin ? 'Admin Dashboard' : t('navAdmin')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
