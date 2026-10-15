import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ChevronLeft, ChevronRight, MessageCircle, 
  Sparkles, ArrowRight, ShieldCheck, Factory
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const TopBannerSlider: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);
  const phoneCallNumber = settings.owner_phone ? settings.owner_phone.replace(/\s+/g, '') : '+919470847471';

  const quickWhatsAppUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${settings.business_name}, मुझे अपनी डेयरी फार्म के लिए राधे कृष्णा पशु आहार के बारे में जानकारी और आर्डर करना है।`
      : `Namaste ${settings.business_name}, I want to enquire about and order Radhe Krishna cattle feed for my dairy farm.`
  )}`;

  // Slides configuration
  const slides = [
    {
      id: 'official-banner',
      type: 'image' as const,
      src: settings.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg',
      alt: lang === 'hi' 
        ? 'राधे कृष्णा पशु आहार - कृष्णा एग्रोवेट, इचाक हजारीबाग' 
        : 'Radhe Krishna Cattle Feed - Krishna Agrovet, Ichak Hazaribagh',
      href: '#products',
      ariaLabel: 'Official Radhe Krishna Pashu Aahar Banner - Click to explore feed products',
    },
    {
      id: 'bypass-protein-promo',
      type: 'custom' as const,
      gradient: 'from-[#072418] via-[#0d3826] to-[#082216]',
      accentColor: '#F5C900',
      badgeIcon: Sparkles,
      badgeText: lang === 'hi' ? 'बाईपास प्रोटीन तकनीक • 15L+ दूध क्षमता' : 'BYPASS PROTEIN TECHNOLOGY • HIGH MILK YIELD',
      title: lang === 'hi' ? 'दूध उत्पादन एवं फैट (Fat & SNF) में भरपूर बढ़ोतरी' : 'Maximize Daily Milk Yield & High Butterfat',
      description: lang === 'hi' 
        ? 'राधे कृष्णा बाईपास पशु आहार - पाचन तंत्र में सुरक्षित रहकर सीधे रक्त में प्रोटीन पहुँचाता है।' 
        : 'Scientifically balanced with rumen-protected bypass protein for superior butterfat and peak animal vitality.',
      highlights: [
        lang === 'hi' ? '15L+ प्रतिदिन दूध उत्पादन' : '15L+ Milk Potential',
        lang === 'hi' ? 'उच्च बटरफैट और SNF' : 'High Butterfat & SNF',
        lang === 'hi' ? 'शुद्ध सीलबंद बोरी' : 'Pure Sealed Sacks'
      ],
      primaryCta: {
        label: lang === 'hi' ? 'उत्पाद देखें' : 'View Products',
        href: '#products',
      },
      secondaryCta: {
        label: lang === 'hi' ? 'WhatsApp आर्डर' : 'Order on WhatsApp',
        href: quickWhatsAppUrl,
        icon: MessageCircle,
        isExternal: true,
      }
    },
    {
      id: 'mill-direct-supply',
      type: 'custom' as const,
      gradient: 'from-[#540c10] via-[#751218] to-[#380608]',
      accentColor: '#F5C900',
      badgeIcon: Factory,
      badgeText: lang === 'hi' ? 'सीधे मिल से ताज़ा स्टॉक • इचाक, हजारीबाग' : 'DIRECT FROM ICHAK MILL • HAZARIBAGH, JHARKHAND',
      title: lang === 'hi' ? 'डेयरी फार्मों एवं थोक व्यापारियों के लिए विशेष दरें' : 'Direct Mill Supply For Dairy Farms & Wholesale',
      description: lang === 'hi' 
        ? 'सीधे कृष्णा एग्रोवेट मिल से आपके फार्म तक सुरक्षित आपूर्ति। बिचौलिया मुक्त, उचित मूल्य व शुद्ध पोषण।' 
        : 'Fresh batch cattle feed delivered straight from our manufacturing facility to your doorstep without middlemen.',
      highlights: [
        lang === 'hi' ? '100% ताज़ा मिल निर्मित' : '100% Fresh Mill Feed',
        lang === 'hi' ? 'फार्म तक सीधी डिलीवरी' : 'Doorstep Unloading',
        lang === 'hi' ? 'कॉल: 9470847471' : 'Call: 9470847471'
      ],
      primaryCta: {
        label: lang === 'hi' ? '📞 9470847471 पर कॉल करें' : '📞 Call 9470847471',
        href: `tel:${phoneCallNumber}`,
      },
      secondaryCta: {
        label: lang === 'hi' ? 'कैटलॉग देखें' : 'Explore Catalog',
        href: '#products',
        icon: ArrowRight,
      }
    }
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance interval
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch handlers for mobile thumb swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section 
      aria-label="Promotional Banners" 
      className="w-full bg-gradient-to-b from-warm-cream/70 to-warm-cream/20 pt-2 sm:pt-4 pb-2 sm:pb-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Banner Frame Card */}
        <div 
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-brand-yellow/40 bg-[#0c1e2a] select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Carousel Track */}
          <div 
            className="flex w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => {
              if (slide.type === 'image') {
                return (
                  <div 
                    key={slide.id}
                    className="w-full shrink-0 relative aspect-[1024/327] min-h-[145px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px] max-h-[420px] bg-[#0c1e2a] flex items-center justify-center overflow-hidden"
                  >
                    <a 
                      href={slide.href} 
                      className="block w-full h-full cursor-pointer relative group"
                      title={slide.alt}
                      aria-label={slide.ariaLabel}
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      
                      {/* Subtle hover overlay hint on desktop */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    </a>
                  </div>
                );
              }

              // Custom Rich Animated Promo Slide
              const BadgeIcon = slide.badgeIcon;
              return (
                <div 
                  key={slide.id}
                  className={`w-full shrink-0 relative aspect-[1024/327] min-h-[145px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px] max-h-[420px] bg-gradient-to-r ${slide.gradient} overflow-hidden flex items-center`}
                >
                  {/* Subtle Background Pattern & Farm Silhouette Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(#F5C900_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
                  <div className="absolute -right-16 -bottom-16 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

                  {/* Slide Content */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-3.5 sm:p-6 md:p-8 lg:p-10 text-white">
                    {/* Top Row: Badge */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/40 border border-brand-yellow/50 backdrop-blur-xs text-brand-yellow text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        <BadgeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-yellow shrink-0 animate-pulse" />
                        <span>{slide.badgeText}</span>
                      </div>
                    </div>

                    {/* Middle: Title & Highlights */}
                    <div className="my-auto py-1 sm:py-2 max-w-3xl">
                      <h2 className="text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black font-heading tracking-tight leading-snug sm:leading-tight drop-shadow-sm">
                        {slide.title}
                      </h2>
                      <p className="hidden sm:block text-xs md:text-sm lg:text-base text-warm-cream/90 font-medium leading-relaxed mt-1 sm:mt-2 max-w-2xl line-clamp-2">
                        {slide.description}
                      </p>

                      {/* Pill features */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mt-2 sm:mt-3">
                        {slide.highlights.map((feat, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/15 border border-white/20 backdrop-blur-xs text-white"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-yellow shrink-0" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 pt-1">
                      <a
                        href={slide.primaryCta.href}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <span>{slide.primaryCta.label}</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>

                      {slide.secondaryCta && (
                        <a
                          href={slide.secondaryCta.href}
                          target={slide.secondaryCta.isExternal ? '_blank' : undefined}
                          rel={slide.secondaryCta.isExternal ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-xs border border-white/30 transition-transform hover:-translate-y-0.5 cursor-pointer"
                        >
                          {slide.secondaryCta.icon && (
                            <slide.secondaryCta.icon className="w-3 h-3 sm:w-4 sm:h-4 text-[#25D366]" />
                          )}
                          <span>{slide.secondaryCta.label}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Banner Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md z-20 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Banner Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md z-20 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots (Bottom Center) */}
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/40 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xs border border-white/20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-brand-yellow shadow-xs'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          {/* Discrete Slide Counter Badge (Top Right) */}
          <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-20 bg-black/50 backdrop-blur-xs border border-white/20 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full pointer-events-none">
            {currentSlide + 1} / {totalSlides}
          </div>
        </div>
      </div>
    </section>
  );
};
