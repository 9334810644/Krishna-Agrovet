import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { 
  HelpCircle, ChevronDown, MessageCircle, Phone, 
  Search, Sparkles, CheckCircle2, Milk, Truck, ShieldCheck, HeartPulse
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

interface FAQItem {
  id: string;
  category: 'nutrition' | 'delivery' | 'quality' | 'usage';
  question: {
    hi: string;
    en: string;
  };
  answer: {
    hi: string;
    en: string;
  };
  highlight?: {
    hi: string;
    en: string;
  };
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'nutrition',
    question: {
      hi: 'राधे कृष्णा पशु आहार किन पशुओं के लिए सबसे अधिक फायदेमंद है?',
      en: 'Which animals benefit the most from Radhe Krishna Cattle Feed?'
    },
    answer: {
      hi: 'यह विशेष रूप से अधिक दूध देने वाली देशी व संकर (HF/Jersey) गायों, मुर्राह व देशी भैंसों तथा ब्यांत के बाद के पशुओं के लिए तैयार किया गया है। यह बछड़े-बछड़ियों के तेजी से शारीरिक विकास और वजन बढ़ाने में भी अत्यंत असरदार है।',
      en: 'It is specially formulated for high-yielding indigenous & crossbred (HF/Jersey) cows, Murrah & local buffaloes, and post-calving cattle. It also boosts healthy weight gain and rapid physical growth in growing calves.'
    },
    highlight: {
      hi: 'गाय, भैंस एवं बछड़ों के लिए संपूर्ण संतुलित पोषण',
      en: 'Complete balanced nutrition for cows, buffaloes & calves'
    }
  },
  {
    id: 'faq-2',
    category: 'quality',
    question: {
      hi: 'बाईपास प्रोटीन (Bypass Protein) तकनीक क्या है और इसके क्या लाभ हैं?',
      en: 'What is Bypass Protein technology and how does it help cattle?'
    },
    answer: {
      hi: 'सामान्य प्रोटीन पशु के पहले पेट (रुमेन) में पचकर बर्बाद हो जाता है, जबकि हमारा बाईपास प्रोटीन रुमेन में नष्ट हुए बिना सीधे चौथे पेट (Abomasum) और छोटी आंत में जाकर 100% अवशोषित होता है। इससे पशु को उच्च कोटि के अमीनो एसिड मिलते हैं, जिससे दूध उत्पादन में 1.5 से 3 लीटर तक की वृद्धि और दूध में फैट (FAT) व SNF प्रतिशत बढ़ता है।',
      en: 'Standard protein gets degraded in the rumen, whereas Bypass Protein bypasses rumen fermentation intact to be fully digested in the lower digestive tract (abomasum & small intestine). This delivers essential amino acids, increasing milk yield by 1.5 to 3 liters and enhancing fat and SNF percentages.'
    },
    highlight: {
      hi: 'अधिक फैट (FAT) व दूध उत्पादन में 15-20% की पुष्टि',
      en: 'Guaranteed boost in milk fat (FAT) and milk yield'
    }
  },
  {
    id: 'faq-3',
    category: 'usage',
    question: {
      hi: 'पशु को प्रतिदिन कितनी मात्रा में आहार देना चाहिए?',
      en: 'What is the recommended daily feeding dosage?'
    },
    answer: {
      hi: 'पशु के सामान्य शरीर के रखरखाव (Maintenance) के लिए 1.5 से 2 किलो प्रतिदिन दें। इसके अतिरिक्त, गायों में प्रति 2.5 से 3 लीटर दूध पर 1 किलो तथा भैंसों में प्रति 2 से 2.5 लीटर दूध पर 1 किलो राधे कृष्णा आहार दें। इसे सूखे चारे या हरे चारे के साथ सूखा या 1-2 घंटे पानी में भिगोकर सानी बनाकर खिलाएं।',
      en: 'For body maintenance, feed 1.5 to 2 kg daily. In addition, feed 1 kg for every 2.5-3 liters of milk for cows, and 1 kg for every 2-2.5 liters of milk for buffaloes. Mix with dry/green fodder or soak in clean water 1-2 hours before feeding.'
    },
    highlight: {
      hi: 'शरीर रखरखाव: 1.5-2kg + दूध उत्पादन अनुसार 1kg',
      en: 'Maintenance: 1.5-2kg + 1kg per milk production ratio'
    }
  },
  {
    id: 'faq-4',
    category: 'delivery',
    question: {
      hi: 'कम से कम कितने बैग का ऑर्डर दे सकते हैं?',
      en: 'What is the minimum order quantity for cattle feed bags?'
    },
    answer: {
      hi: 'आप कम से कम 1 बोरी (50 किलो) से लेकर पूरा टेम्पो या ट्रक लोड (थोक मात्रा) तक का ऑर्डर दे सकते हैं। यदि आप 20 या उससे अधिक बोरियों का थोक ऑर्डर देते हैं, तो आपको विशेष मिल रेट और प्राथमिकता डिलीवरी दी जाती है।',
      en: 'You can order starting from as little as 1 bag (50 kg) up to full tempo or truckloads. For bulk orders of 20+ bags, special direct mill rates and prioritized farm transport are provided.'
    },
    highlight: {
      hi: 'न्यूनतम 1 बैग से लेकर पूरा टेम्पो लोड तक उपलब्ध',
      en: 'Available from 1 sack to full commercial truckloads'
    }
  },
  {
    id: 'faq-5',
    category: 'delivery',
    question: {
      hi: 'डिलीवरी कैसे और कब तक मेरे फार्म पर पहुंचेगी?',
      en: 'How and within what timeframe will the feed be delivered to my farm?'
    },
    answer: {
      hi: 'ऑर्डर मिलने के बाद सीधे हमारी मिल (कृष्णा एग्रोवेट) से ताज़ा बोरियां लोड होकर स्थानीय टेम्पो/पिकअप द्वारा सीधे आपके गांव व डेयरी शेड तक पहुंचाई जाती हैं। अधिकांश ऑर्डर 24 से 48 घंटे के भीतर सुरक्षित पहुंचा दिए जाते हैं।',
      en: 'Once your order is confirmed, fresh bags are loaded directly from the Krishna Agrovet mill onto local tempo/pickup vans and dispatched to your village farm shed, typically within 24 to 48 hours.'
    },
    highlight: {
      hi: 'सीधे मिल से 24-48 घंटों में फार्म तक सुरक्षित टेम्पो डिलीवरी',
      en: 'Direct mill-to-farm tempo delivery within 24-48 hours'
    }
  },
  {
    id: 'faq-6',
    category: 'delivery',
    question: {
      hi: 'भुगतान (Payment) के क्या-क्या विकल्प हैं?',
      en: 'What payment options are available upon order and delivery?'
    },
    answer: {
      hi: 'हम आपके भरोसे और सुविधा के लिए कैश ऑन डिलीवरी (डिलीवरी के समय नकद भुगतान), UPI (Google Pay, PhonePe, Paytm), तथा बैंक ट्रांसफर स्वीकार करते हैं। जब माल आपकी संतुष्टि अनुसार पहुंच जाए, तब आप भुगतान कर सकते हैं।',
      en: 'For your security, we accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and direct bank transfers. You pay comfortably once your feed bags arrive at your farm.'
    },
    highlight: {
      hi: 'कैश ऑन डिलीवरी (COD) व UPI दोनों सुविधाएं उपलब्ध',
      en: 'Cash on Delivery (COD) and UPI payments supported'
    }
  },
  {
    id: 'faq-7',
    category: 'quality',
    question: {
      hi: 'क्या बोरियां सीधे फैक्ट्री से 100% असली व सीलबंद आती हैं?',
      en: 'Are the bags 100% authentic and sealed directly from the factory?'
    },
    answer: {
      hi: 'हां, राधे कृष्णा पशु आहार की प्रत्येक बोरी (लाल-पीली बाईपास प्रोटीन एवं फ़िरोज़ी-पीली एक्स्ट्राप्रो) कृष्णा एग्रोवेट के कड़े गुणवत्ता मानकों और सुरक्षा सील के साथ मिल से सीधे भेजी जाती है। इसमें किसी भी मिलावट की कोई गुंजाइश नहीं होती।',
      en: 'Yes, every Radhe Krishna sack (Red-Yellow Bypass Protein and Turquoise-Yellow Ekstrapro) carries Krishna Agrovet verified mill stitching and tamper-proof branding with zero adulteration.'
    },
    highlight: {
      hi: '100% प्रामाणिक मिल बोरियां, शुद्धता की पूर्ण गारंटी',
      en: '100% authentic mill-sealed sacks with purity guarantee'
    }
  },
  {
    id: 'faq-8',
    category: 'nutrition',
    question: {
      hi: 'क्या आहार बदलने पर पशु के पाचन पर कोई प्रतिकूल असर पड़ता है?',
      en: 'Does changing the feed affect the animal’s digestion?'
    },
    answer: {
      hi: 'किसी भी नए आहार को अचानक 100% न बदलें। पहले 3-4 दिन पुराने आहार में 25% राधे कृष्णा मिलाएं, फिर धीरे-धीरे 5-7 दिनों में 100% कर दें। राधे कृष्णा में मौजूद पाचक एंजाइम्स और प्रोबायोटिक्स पशु के पाचन को दुरुस्त और गोबर को सामान्य रखते हैं।',
      en: 'Gradual transition is best: mix 25% Radhe Krishna feed with current feed for 3-4 days, increasing to 100% over 5-7 days. Radhe Krishna contains digestive enzymes and prebiotics that keep digestion healthy and optimize rumen pH.'
    },
    highlight: {
      hi: 'सहज पाचन और पाचक एंजाइम्स से भरपूर',
      en: 'Gentle digestion enriched with gut-friendly enzymes'
    }
  }
];

export const FAQSection: React.FC = () => {
  const { lang } = useLanguage();
  const { settings } = useStoreSettings();
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cleanWhatsAppNumber = normalizeWhatsAppNumber(settings.owner_whatsapp);

  const categories = [
    { id: 'all', label: lang === 'hi' ? 'सभी प्रश्न' : 'All FAQs', icon: Sparkles },
    { id: 'nutrition', label: lang === 'hi' ? 'पोषण व आहार' : 'Nutrition & Feed', icon: Milk },
    { id: 'quality', label: lang === 'hi' ? 'बाईपास प्रोटीन व गुणवत्ता' : 'Quality & Bypass', icon: ShieldCheck },
    { id: 'usage', label: lang === 'hi' ? 'मात्रा व खुराक' : 'Feeding Dosage', icon: HeartPulse },
    { id: 'delivery', label: lang === 'hi' ? 'ऑर्डर व डिलीवरी' : 'Orders & Delivery', icon: Truck },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const questionText = (item.question[lang] || item.question.en).toLowerCase();
      const answerText = (item.answer[lang] || item.answer.en).toLowerCase();
      return questionText.includes(q) || answerText.includes(q);
    });
  }, [activeCategory, searchQuery, lang]);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  const directWhatsAppUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${settings.business_name}, मुझे राधे कृष्णा पशु आहार के बारे में एक सवाल पूछना है।`
      : `Namaste ${settings.business_name}, I have a question regarding Radhe Krishna cattle feed products and feeding.`
  )}`;

  return (
    <section id="faq" className="py-14 sm:py-20 bg-warm-cream/50 border-b border-warm-cream-dark scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-krishna-red/10 border border-krishna-red/20 text-krishna-red text-xs sm:text-sm font-bold mb-3 shadow-2xs">
            <HelpCircle className="w-4 h-4 text-krishna-red" />
            <span>{lang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (FAQ)' : 'Frequently Asked Questions (FAQ)'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-deep-charcoal font-heading tracking-tight leading-tight">
            {lang === 'hi' ? (
              <>
                पशु आहार और पोषण से जुड़े <span className="text-krishna-red">महत्वपूर्ण प्रश्न</span>
              </>
            ) : (
              <>
                Everything You Need to Know About <span className="text-krishna-red">Radhe Krishna Feed</span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-charcoal-muted leading-relaxed">
            {lang === 'hi'
              ? 'दूध की मात्रा, फैट (FAT), बाईपास प्रोटीन तकनीक और सीधे फार्म तक डिलीवरी से संबंधित अक्सर पूछे जाने वाले प्रश्नों के उत्तर।'
              : 'Answers to common questions about milk fat, Bypass Protein technology, dosage, and doorstep farm delivery.'}
          </p>

          {/* Quick Search Input */}
          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'सवाल या विषय खोजें (उदा. फैट, डिलीवरी, खुराक)...' : 'Search questions (e.g. fat, delivery, dosage)...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-warm-cream-dark rounded-xl text-sm text-deep-charcoal placeholder:text-charcoal-muted/70 focus:outline-hidden focus:ring-2 focus:ring-krishna-red shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-charcoal-muted hover:text-deep-charcoal"
              >
                {lang === 'hi' ? 'साफ़ करें' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 scrollbar-none justify-start sm:justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-krishna-red text-white shadow-sm scale-102'
                    : 'bg-white text-deep-charcoal hover:bg-warm-cream border border-warm-cream-dark'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-yellow' : 'text-krishna-red'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Accordion List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-warm-cream-dark p-6">
              <HelpCircle className="w-10 h-10 text-charcoal-muted mx-auto mb-2 opacity-60" />
              <p className="text-deep-charcoal font-bold text-base">
                {lang === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}
              </p>
              <p className="text-xs text-charcoal-muted mt-1">
                {lang === 'hi'
                  ? 'कृपया दूसरा शब्द खोजें या नीचे दिए गए WhatsApp बटन से सीधे पूछें।'
                  : 'Try searching with different terms or ask directly via WhatsApp below.'}
              </p>
            </div>
          ) : (
            filteredFaqs.map((item, idx) => {
              const isOpen = openId === item.id;
              const qText = item.question[lang] || item.question.en;
              const aText = item.answer[lang] || item.answer.en;
              const highlightText = item.highlight ? (item.highlight[lang] || item.highlight.en) : null;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                    isOpen 
                      ? 'border-brand-yellow ring-2 ring-brand-yellow/30 shadow-md' 
                      : 'border-warm-cream-dark hover:border-krishna-red/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 focus:outline-hidden"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-black shrink-0 mt-0.5 transition-colors ${
                        isOpen 
                          ? 'bg-krishna-red text-white' 
                          : 'bg-warm-cream text-krishna-red'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-sm sm:text-base font-bold transition-colors leading-snug ${
                        isOpen ? 'text-krishna-red' : 'text-deep-charcoal hover:text-krishna-red'
                      }`}>
                        {qText}
                      </span>
                    </div>

                    <div className={`p-1 rounded-lg shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-brand-yellow/20 text-krishna-red' : 'text-charcoal-muted'
                    }`}>
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 animate-pop-in">
                      <div className="p-3.5 sm:p-4 rounded-xl bg-warm-cream/60 border border-warm-cream-dark text-xs sm:text-sm text-deep-charcoal leading-relaxed space-y-2">
                        <p>{aText}</p>
                        {highlightText && (
                          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-krishna-red-dark border-t border-warm-cream-dark">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{highlightText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions CTA Card */}
        <div className="mt-10 sm:mt-14 bg-gradient-to-br from-deep-charcoal via-[#2A2320] to-krishna-red-dark text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-brand-yellow/30 flex flex-col md:flex-row items-center justify-between gap-6 card-hover-lift">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold animate-pulse">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'विशेषज्ञ सहायता' : 'Direct Feed Consultation'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black font-heading text-white">
              {lang === 'hi' ? 'क्या आपका कोई और सवाल है?' : 'Still Have Questions About Feed & Herd Nutrition?'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              {lang === 'hi'
                ? 'हमारे डेयरी व पशु आहार विशेषज्ञ से WhatsApp पर सीधे सलाह लें या अपनी ज़रूरत के अनुसार सही उत्पाद का चुनाव करें।'
                : 'Chat directly with our cattle feed experts on WhatsApp or call us to choose the ideal feed formulation for your herd.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm shadow-md glow-green-hover transition-all duration-300 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>{lang === 'hi' ? 'WhatsApp पर पूछें' : 'Ask on WhatsApp'}</span>
            </a>

            <a
              href={`tel:${settings.owner_phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
            >
              <Phone className="w-4 h-4 text-brand-yellow" />
              <span>{settings.owner_phone}</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
