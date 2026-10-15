import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TopBannerSlider: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang } = useLanguage();

  // Slide state: 0 = primary banner, 1 = duplicate clone for seamless infinite slide transition
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const isAnimatingRef = useRef<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const resetTimeoutRef = useRef<any>(null);

  const bannerSrc = settings.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg';
  const bannerAlt = lang === 'hi' 
    ? 'राधे कृष्णा पशु आहार - कृष्णा एग्रोवेट, इचाक हजारीबाग' 
    : 'Radhe Krishna Cattle Feed - Krishna Agrovet, Ichak Hazaribagh';

  // Smooth slide forward (Next)
  const slideNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    setIsTransitioning(true);
    setSlideIndex(1);

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      // Instantly reset back to 0 without transition (imperceptible because Copy 1 & Copy 2 are identical)
      setIsTransitioning(false);
      setSlideIndex(0);
      isAnimatingRef.current = false;
    }, 760);
  }, []);

  // Smooth slide backward (Prev)
  const slidePrev = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // First jump silently to 1 with no animation
    setIsTransitioning(false);
    setSlideIndex(1);

    // Then animate back to 0 so it slides from left to right
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
        setSlideIndex(0);

        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          isAnimatingRef.current = false;
        }, 760);
      });
    });
  }, []);

  // Automatic sliding interval: slides smoothly across every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      slideNext();
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, slideNext]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
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
      {/* Seamless Sliding Carousel Track */}
      <div 
        className="flex w-full will-change-transform"
        style={{ 
          transform: `translateX(-${slideIndex * 100}%)`,
          transition: isTransitioning 
            ? 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1)' 
            : 'none'
        }}
      >
        {/* Copy 1: Primary Banner filling the screen width */}
        <div className="w-full shrink-0 relative">
          <a 
            href="#products" 
            className="block w-full cursor-pointer relative"
            title={bannerAlt}
            aria-label={bannerAlt}
          >
            <img
              src={bannerSrc}
              alt={bannerAlt}
              className="w-full h-auto block object-cover sm:object-fill max-h-[520px] transition-opacity duration-300"
              loading="eager"
            />
          </a>
        </div>

        {/* Copy 2: Duplicate Banner to allow continuous seamless sliding */}
        <div className="w-full shrink-0 relative">
          <a 
            href="#products" 
            className="block w-full cursor-pointer relative"
            title={bannerAlt}
            aria-label={bannerAlt}
          >
            <img
              src={bannerSrc}
              alt={bannerAlt}
              className="w-full h-auto block object-cover sm:object-fill max-h-[520px] transition-opacity duration-300"
              loading="lazy"
            />
          </a>
        </div>
      </div>

      {/* Left Navigation Arrow */}
      <button
        type="button"
        onClick={slidePrev}
        aria-label="Slide Previous"
        className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg z-20 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      {/* Right Navigation Arrow */}
      <button
        type="button"
        onClick={slideNext}
        aria-label="Slide Next"
        className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/30 backdrop-blur-xs flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg z-20 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      {/* Subtle Slide Animation Indicator Bar at the bottom */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-none">
        <span 
          className={`h-1.5 rounded-full transition-all duration-700 bg-brand-yellow shadow-xs ${
            slideIndex === 0 ? 'w-8 sm:w-10 opacity-90' : 'w-4 sm:w-6 opacity-60'
          }`} 
        />
      </div>
    </section>
  );
};
