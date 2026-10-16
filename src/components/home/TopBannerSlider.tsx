import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TopBannerSlider: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang } = useLanguage();

  const banners = (settings.hero_banners && settings.hero_banners.length > 0)
    ? settings.hero_banners
    : [settings.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg'];

  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const bannerAlt = lang === 'hi' 
    ? 'राधे कृष्णा पशु आहार - कृष्णा एग्रोवेट, इचाक हजारीबाग' 
    : 'Radhe Krishna Cattle Feed - Krishna Agrovet, Ichak Hazaribagh';

  // Keep slideIndex in valid range if banners list changes
  useEffect(() => {
    if (slideIndex >= banners.length) {
      setSlideIndex(0);
    }
  }, [banners.length, slideIndex]);

  // Smooth slide forward (Next)
  const slideNext = useCallback(() => {
    if (banners.length <= 1) return;
    setSlideIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  // Smooth slide backward (Prev)
  const slidePrev = useCallback(() => {
    if (banners.length <= 1) return;
    setSlideIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Automatic sliding interval: rotates every 4.5 seconds
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => {
      slideNext();
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, banners.length, slideNext]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || banners.length <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      slideNext();
    } else if (distance < -minSwipeDistance) {
      slidePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section 
      aria-label="Promotional Sliding Banner" 
      className="w-full bg-[#0c1e2a] overflow-hidden select-none relative p-0 m-0 border-b border-brand-yellow/30 shadow-md group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Auto-advance animated progress bar (shown when multiple banners exist) */}
      {banners.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/25 z-20 overflow-hidden">
          <div 
            key={`banner-progress-${slideIndex}-${isPaused}`}
            className="h-full bg-gradient-to-r from-brand-yellow via-brand-yellow-light to-brand-yellow"
            style={{
              animation: isPaused ? 'none' : 'sliderLine 4.5s linear forwards'
            }}
          />
        </div>
      )}

      {/* Sliding Carousel Track */}
      <div 
        className="flex w-full will-change-transform transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateX(-${slideIndex * 100}%)`,
        }}
      >
        {banners.map((src, index) => (
          <div key={`banner-slide-${index}`} className="w-full shrink-0 relative overflow-hidden">
            <a 
              href="#products" 
              className="block w-full cursor-pointer relative"
              title={bannerAlt}
              aria-label={`${bannerAlt} (${index + 1})`}
            >
              <img
                src={src}
                alt={`${bannerAlt} - ${index + 1}`}
                className="w-full h-auto block object-cover sm:object-fill max-h-[520px] transition-transform duration-700 ease-out hover:scale-102"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </a>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (shown if more than 1 banner exists) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={slidePrev}
            aria-label="Previous Banner"
            className="absolute left-1.5 sm:left-5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg z-20 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={slideNext}
            aria-label="Next Banner"
            className="absolute right-1.5 sm:right-5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg z-20 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Interactive Dot Indicators (shown if more than 1 banner exists) */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={`banner-dot-${index}`}
              type="button"
              onClick={() => setSlideIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                slideIndex === index
                  ? 'w-6 sm:w-8 bg-brand-yellow shadow-md'
                  : 'w-2 sm:w-2.5 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
