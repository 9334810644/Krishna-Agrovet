import React, { createContext, useContext, useState } from 'react';

export type Language = 'hi' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'rkpa_language_v1';

const DICTIONARY: Record<Language, Record<string, string>> = {
  hi: {
    // Brand
    brandName: 'राधे कृष्णा पशु आहार',
    brandSub: 'पशु आहार',
    manufacturerText: 'निर्माता: कृष्णा एग्रोवेट (KRISHNA AGROVET)',
    tagline: 'भरोसेमंद पशु आहार, आपके पशुधन के लिए',
    deliveryAnnouncement: '🌾 राधे कृष्णा पशु आहार • कृष्णा एग्रोवेट • 50 किग्रा पैकिंग • सीधे फार्म तक टेम्पो डिलीवरी',

    // Header & Nav
    navProducts: 'उत्पाद कैटलॉग',
    navBenefits: 'गुणवत्ता व पोषण',
    navAbout: 'हमारे बारे में',
    navDelivery: 'डिलीवरी क्षेत्र',
    navWhatsApp: 'व्हाट्सएप',
    navAdmin: 'प्रबंधक पोर्टल',
    searchPlaceholder: 'पशु आहार, बाईपास प्रोटीन, एक्स्ट्राप्रो खोजें...',
    cartBtn: 'कार्ट',
    bagsCount: 'बैग',

    // Hero
    heroHeadline: 'भरोसेमंद पशु आहार, आपके पशुधन के लिए',
    heroSubline: 'आपकी डेयरी की उन्नति और पशुओं के संपूर्ण पोषण के लिए',
    heroParagraph: 'उत्तम पाचकता, बाईपास प्रोटीन और संतुलित ऊर्जा से भरपूर 50 किग्रा पशु आहार। दूध की मात्रा, गाढ़ापन और फैट (FAT) बढ़ाने के लिए डेयरी किसानों की पहली पसंद।',
    heroCtaPrimary: 'हमारे उत्पाद देखें',
    heroCtaWhatsApp: 'WhatsApp पर संपर्क करें',
    heroPill: 'सीधे मिल से ताज़ा आपूर्ति • 50 किग्रा बोरियां',
    heroBenefit1: '20-24% क्रूड प्रोटीन',
    heroBenefit2: 'अधिक फैट (FAT) व SNF',
    heroBenefit3: 'डिलीवरी पर नकद भुगतान',
    heroFreeDeliveryNote: 'गांव के शेड तक सुरक्षित टेम्पो डिलीवरी',
    realPackaging: 'कृष्णा एग्रोवेट • 50 किग्रा प्रामाणिक पैकिंग',
    realProductsCount: '2 प्रामाणिक उत्पाद',
    genuineSacksNote: '100% प्रामाणिक मिल बोरियां',
    standard50kg: 'मानक 50 किग्रा',

    // Featured Bags
    featuredRedTitle: 'राधे कृष्णा बाईपास प्रोटीन',
    featuredRedSub: 'लाल व पीला बैग (50 किग्रा)',
    featuredTurqTitle: 'राधे कृष्णा एक्स्ट्राप्रो',
    featuredTurqSub: 'फ़िरोज़ी व पीला बैग (50 किग्रा)',

    // Product Section
    catalogTitle: 'पशु आहार उत्पाद सूची',
    catalogSubtitle: 'कृष्णा एग्रोवेट द्वारा निर्मित प्रामाणिक 50 किग्रा बोरियां एवं पूरक आहार।',
    filterAll: 'सभी उत्पाद',
    filterBrand: 'ब्रांड',
    filterWeight: 'बैग वजन',
    filterInStockOnly: 'केवल उपलब्ध स्टॉक',
    sortLabel: 'क्रमबद्ध:',
    sortFeatured: 'विशेष चयनित (Featured)',
    sortName: 'उत्पाद का नाम (A-Z)',
    sortWeight: 'बैग वजन (अधिक से कम)',
    perBag: 'प्रति बैग',
    bagWeightUnit: 'किग्रा बैग',
    rateOnWhatsApp: 'व्हाट्सएप पर दर',
    bagUnit: 'किग्रा बोरी',
    inStockText: 'स्टॉक में उपलब्ध',
    lowStockText: 'कम स्टॉक शेष',
    outOfStockText: 'स्टॉक समाप्त',
    addBagBtn: 'कार्ट में जोड़ें',
    addedBtn: 'जोड़ा गया!',
    maxInCart: 'कार्ट सीमा',
    viewDetails: 'पोषण विवरण व खुराक विधि देखें',
    noProductsFound: 'कोई उत्पाद आपके फिल्टर से मेल नहीं खाता',
    resetFilters: 'सभी फिल्टर हटाएं',

    // Modal Details
    modalTitle: 'उत्पाद विवरण',
    nutritionSpecs: 'पोषक तत्व विश्लेषण (Nutritional Specs)',
    feedingGuide: 'दैनिक खुराक विधि (Feeding Guide)',
    guaranteedWeight: 'शुद्ध 50 किग्रा मानक पैकिंग',

    // Cart Drawer & Page
    cartTitle: 'आपकी शॉपिंग कार्ट',
    cartEmpty: 'आपकी कार्ट अभी खाली है',
    cartEmptyDesc: 'ऑर्डर शुरू करने के लिए कैटलॉग से बाईपास प्रोटीन या एक्स्ट्राप्रो बैग जोड़ें।',
    exploreProductsBtn: 'उत्पाद देखें',
    freeDeliveryUnlocked: 'फार्म तक सीधी टेम्पो डिलीवरी',
    addMoreBagsForFree: 'सीधे फार्म तक डिलीवरी',
    totalSacks: 'कुल बोरियां (Sacks)',
    totalNetWeight: 'कुल शुद्ध वजन',
    subtotal: 'सामग्री मूल्य (Subtotal)',
    deliveryCharges: 'फार्म डिलीवरी शुल्क',
    freeText: 'फार्म डिलीवरी (Doorstep Delivery)',
    totalOrderAmount: 'कुल देय राशि',
    proceedCheckout: 'डिलीवरी पता भरें और ऑर्डर करें',
    directWhatsAppInquiry: 'सीधे व्हाट्सएप पर पूछताछ करें',
    clearCart: 'कार्ट खाली करें',
    stickyCartTitle: 'कार्ट में',
    stickyProceed: 'ऑर्डर करें',

    // Checkout
    checkoutTitle: 'फार्म डिलीवरी विवरण एवं ऑर्डर',
    checkoutSubtitle: 'कृपया अपना नाम, गांव और पता भरें। ऑर्डर सेव होने के बाद व्हाट्सएप पर संदेश तैयार होगा।',
    nameLabel: 'किसान / डेयरी मालिक का नाम',
    namePlaceholder: 'उदा. चौधरी रमेश यादव',
    phoneLabel: '10-अंकों का व्हाट्सएप मोबाइल नंबर',
    phonePlaceholder: '98290XXXXX',
    villageLabel: 'गांव / ग्राम पंचायत / कस्बा',
    villagePlaceholder: 'उदा. ग्राम माचाड़ी, तहसील रैणी',
    addressLabel: 'पूरा पता व शेड का स्थान',
    addressPlaceholder: 'मंडी के पास, यादव मोहल्ला, गौशाला रोड',
    landmarkLabel: 'निकटतम पहचान चिन्ह (Landmark)',
    landmarkPlaceholder: 'उदा. मंदिर या स्कूल के पास',
    pinLabel: 'पिन कोड (PIN Code)',
    pinPlaceholder: '301408',
    districtLabel: 'जिला',
    stateLabel: 'राज्य',
    notesLabel: 'डिलीवरी निर्देश (वैकल्पिक)',
    notesPlaceholder: 'सुबह 8 बजे से पहले लाएं, ट्रैक्टर आसानी से आ सकता है',
    paymentLabel: 'भुगतान का तरीका',
    codText: 'कैश ऑन डिलीवरी (डिलीवरी पर नकद भुगतान)',
    submitOrderBtn: 'ऑर्डर सुरक्षित करें और व्हाट्सएप खोलें',
    orderSavingNote: 'ऑर्डर पहले सिस्टम में सुरक्षित होगा, फिर व्हाट्सएप खुलेगा।',

    // Order Confirmation
    orderConfirmedTitle: 'आपका ऑर्डर सफलतापूर्वक दर्ज हुआ!',
    orderIdText: 'ऑर्डर संख्या',
    importantStepTitle: 'जरूरी कदम: व्हाट्सएप पर सेंड (Send) दबाएं',
    importantStepDesc: 'आपका ऑर्डर सिस्टम में सुरक्षित हो चुका है। कृपया नीचे दिए गए हरे बटन पर टैप करके व्हाट्सएप पर "Send" दबाएं ताकि मालिक से तुरंत डिलीवरी की पुष्टि हो सके।',
    openWhatsAppBtn: 'व्हाट्सएप खोलें और ऑर्डर भेजें',
    copyMessageBtn: 'संदेश कॉपी करें',
    copiedText: 'कॉपी हो गया!',
    printReceipt: 'रसीद प्रिंट करें',

    // Brand Story
    aboutBadgeText: 'ब्रांड परिचय • कृष्णा एग्रोवेट',
    aboutTitle: 'राधे कृष्णा पशु आहार के बारे में',
    aboutSubtitle: 'कृष्णा एग्रोवेट द्वारा उच्च गुणवत्ता मानकों पर तैयार किया गया विश्वसनीय पशु आहार।',
    aboutPara1: 'राधे कृष्णा पशु आहार (Radhe Krishna Pashu Aahar) क्षेत्रीय डेयरी किसानों की जरूरतों को ध्यान में रखकर कृष्णा एग्रोवेट (KRISHNA AGROVET) द्वारा निर्मित किया जाता है। हमारे प्रमुख उत्पाद — बाईपास प्रोटीन (Bypass Protein) और एक्स्ट्राप्रो (Ekstrapro) — पशुओं के स्वास्थ्य और दैनिक दूध उत्पादन को सशक्त बनाने के लिए जाने जाते हैं।',
    aboutPara2: 'हर बोरी में 50 किग्रा शुद्ध वजन, सख्त गुणवत्ता परीक्षण, और ताजा मिल से सीधी आपूर्ति सुनिश्चित की जाती है। हम ग्रामीण क्षेत्रों और ग्राम पंचायतों में सीधे डेयरी शेड तक टेम्पो डिलीवरी की सुविधा प्रदान करते हैं।',
    fact1Title: '50 किग्रा मानक पैकिंग',
    fact1Sub: '50 किग्रा शुद्ध वजन',
    fact1Desc: 'मजबूत सिलाई, नमी-रोधी अस्तर के साथ मानक वजन वाली बोरियां।',
    fact2Title: 'विशिष्ट फॉर्मूलेशन',
    fact2Sub: 'बाईपास एवं एक्स्ट्राप्रो',
    fact2Desc: 'बाईपास प्रोटीन (लाल बैग) और एक्स्ट्राप्रो (फ़िरोज़ी बैग) उच्च दुग्ध उत्पादक पशुओं के लिए।',
    fact3Title: 'ग्रामीण शेड तक डिलीवरी',
    fact3Sub: 'फार्म शेड तक डिलीवरी',
    fact3Desc: 'आपके गांव और आसपास की ग्राम पंचायतों में सीधे वाहन से डिलीवरी।',
    fact4Title: 'व्हाट्सएप पर सीधा ऑर्डर',
    fact4Sub: 'व्हाट्सएप पर सीधा संपर्क',
    fact4Desc: 'मिल मालिक से सीधे संपर्क करें और डिलीवरी पर नकद भुगतान की सुविधा पाएं।',
    aboutCtaWhatsApp: 'WhatsApp पर जानकारी प्राप्त करें',

    // Trust & Benefits
    trustTag: 'कृष्णा एग्रोवेट की विशेषताएं',
    trustTitle: 'किसानों का विश्वास, पशुओं की सेहत',
    whyUsSubtitle: 'दूध में प्रत्येक 0.5% फैट की वृद्धि सीधे आपके डेयरी भुगतान को बढ़ाती है।',
    trustFeat1Title: 'बाईपास प्रोटीन फॉर्मूलेशन',
    trustFeat1Desc: 'रुमेन-प्रोटेक्टेड प्रोटीन जो सीधे पेट में पहुंचकर दूध की मात्रा और फैट प्रतिशत को बढ़ाता है।',
    trustFeat2Title: 'एक्स्ट्राप्रो संतुलित ऊर्जा',
    trustFeat2Desc: 'विशेष संतुलित पोषक तत्व जो उच्च दुग्ध उत्पादन वाले पशुओं की रोग प्रतिरोधक क्षमता बनाए रखते हैं।',
    trustFeat3Title: 'शुद्ध 50 किग्रा मानक वजन',
    trustFeat3Desc: 'हर बोरी मजबूत सिलाई, नमी-रोधी बैग और पूरे 50 किग्रा मानक वजन के साथ आती है।',
    trustFeat4Title: 'सीधे डेयरी शेड तक डिलीवरी',
    trustFeat4Desc: 'ग्रामीण ग्राम पंचायतों और ढाणियों में आपके पशु बाड़े तक सुरक्षित टेम्पो डिलीवरी।',
    trustFeat5Title: 'कैश ऑन डिलीवरी (COD)',
    trustFeat5Desc: 'अपने फार्म या शेड पर 50 किग्रा बैग की जांच करने के बाद ही नकद भुगतान करें।',
    trustFeat6Title: 'पशुओं का स्वास्थ्य व मजबूती',
    trustFeat6Desc: 'संतुलित आवश्यक खनिज और अमीनो एसिड ब्यात के बाद गाय-भैंस को कमजोरी से बचाते हैं।',

    // Delivery Coverage
    deliveryPill: 'फार्म-टू-फार्म ग्रामीण लॉजिस्टिक्स',
    deliveryTitle: 'आपके फार्म, गौशाला या ग्रामीण मंडी तक सीधी डिलीवरी',
    deliveryPara: 'हम ग्रामीण क्षेत्रों में सीधे आपके पशु बाड़े तक 50 किग्रा पशु आहार बोरियां पहुंचाते हैं। हमारा समर्पित डिलीवरी वाहन यह सुनिश्चित करता है कि आपकी बोरियां सुरक्षित, सूखी और सही जगह रखी जाएं।',
    deliveryActiveCoverage: 'सक्रिय डिलीवरी क्षेत्र',
    deliverySameDay: 'उसी दिन / अगले दिन फार्म प्रेषण',
    deliveryFreeThreshold: 'सीधे फार्म तक सुरक्षित टेम्पो डिलीवरी',
    deliveryUrgentTitle: 'क्या आज तत्काल पशु आहार की आवश्यकता है?',
    deliveryUrgentDesc: 'यदि आपके पशुओं का चारा खत्म हो गया है या आपको 20+ बोरियों की थोक आपूर्ति चाहिए, तो तुरंत मालिक से संपर्क करें।',
    deliveryCallBtn: 'कॉल करें',
    deliveryMessageBtn: 'व्हाट्सएप पर संदेश भेजें',

    // Footer
    footerDesc: 'राधे कृष्णा पशु आहार • निर्माता: कृष्णा एग्रोवेट। प्रामाणिक 50 किग्रा पशु आहार बोरियां, बाईपास प्रोटीन, एक्स्ट्राप्रो और खनिज मिश्रण।',
    footerQuickLinks: 'त्वरित लिंक',
    footerDispatch: 'फार्म डिलीवरी समय',
    footerContact: 'संपर्क एवं सहायता',
    footerRights: 'सर्वाधिकार सुरक्षित।',
    footerSacksLinkTitle: 'प्रमुख उत्पाद बोरियां (50 किग्रा)',
    footerQualityLink: 'गुणवत्ता व पोषण लाभ',
    footerBrandStoryLink: 'ब्रांड परिचय व मिल इतिहास',
    footerDeliveryAreasLink: 'ग्रामीण डिलीवरी क्षेत्र',
    footerGenuineAssurance: '100% प्रामाणिक 50 किग्रा मिल पैकेजिंग',
    footerDoorstepTitle: 'सीधे फार्म तक डिलीवरी:',
    footerDoorstepDesc: 'आपके पशु बाड़े और गौशाला तक सुरक्षित टेम्पो परिवहन।',
    footerDispatchSchedTitle: 'प्रेषण समय:',
    footerDispatchSchedDesc: 'सुबह और शाम ग्रामीण रूटों पर डिलीवरी वाहन रवानगी।',
    footerOfficeAddressTitle: 'कार्यालय का पता (Office Address):',
    footerManufacturingTitle: 'विनिर्माण इकाई (मिल):',

    // Photo Consultation
    consultationNavBtn: 'फोटो सलाह',
    consultationTag: 'फोटो भेजकर परामर्श • डिवाइस से अपलोड करें',
    consultationTitle: 'पशु आहार परामर्श: अपने डिवाइस से फोटो भेजें',
    consultationSubtitle: 'अपने दुधारू पशु, वर्तमान आहार कट्टे या डॉक्टर की पर्ची की फोटो खींचें और कृष्णा एग्रोवेट के विशेषज्ञों से सीधे व्हाट्सएप पर सही आहार की सलाह पाएं।',
    consultPhotoLabel: 'कैमरे या गैलरी से फोटो चुनें *',
    consultPhotoSub: 'JPG, PNG, WebP (स्मार्टफोन कैमरा या गैलरी)',
    consultTypeLabel: 'फोटो का प्रकार',
    consultType1: 'दुधारू गाय या भैंस (Cow / Buffalo)',
    consultType2: 'वर्तमान आहार का कट्टा / लेबल (Current Feed Sack)',
    consultType3: 'डॉक्टर की पर्ची / फैट टेस्ट पर्ची (Doctor Slip / Fat Test)',
    consultMilkYield: 'दैनिक दूध उत्पादन (लीटर/दिन)',
    consultWhatsAppBtn: 'व्हाट्सएप पर फोटो के साथ सलाह लें',
  },
  en: {
    // Brand
    brandName: 'Radhe Krishna Pashu Aahar',
    brandSub: 'Cattle Feed',
    manufacturerText: 'Manufactured by KRISHNA AGROVET',
    tagline: 'Trusted Cattle Feed for Your Dairy Livestock',
    deliveryAnnouncement: '🌾 Radhe Krishna Pashu Aahar • Krishna Agrovet • 50 KG Packing • Direct Farm Doorstep Delivery',

    // Header & Nav
    navProducts: 'Products',
    navBenefits: 'Nutrition & Quality',
    navAbout: 'About Us',
    navDelivery: 'Delivery Coverage',
    navWhatsApp: 'WhatsApp',
    navAdmin: 'Staff Portal',
    searchPlaceholder: 'Search cattle feed, Bypass Protein, Ekstrapro...',
    cartBtn: 'Cart',
    bagsCount: 'bags',

    // Hero
    heroHeadline: 'Trusted Cattle Feed for Your Dairy Livestock',
    heroSubline: 'Engineered for Higher Milk Yield, Butterfat & Cattle Vigor',
    heroParagraph: 'Scientifically balanced 50 kg cattle feed sacks loaded with bypass protein, digestible energy, and vital minerals. Engineered to boost milk yield, SNF, and FAT for progressive dairy farmers.',
    heroCtaPrimary: 'Explore Products',
    heroCtaWhatsApp: 'Contact on WhatsApp',
    heroPill: 'Fresh Mill Batches • 50 KG Standard Packing',
    heroBenefit1: '20-24% Crude Protein',
    heroBenefit2: 'Higher Milk FAT & SNF',
    heroBenefit3: 'Pay on Doorstep Delivery',
    heroFreeDeliveryNote: 'Direct village farm delivery by tempo',
    realPackaging: 'KRISHNA AGROVET • 50 KG REAL PACKAGING',
    realProductsCount: '2 REAL PRODUCTS',
    genuineSacksNote: '100% Genuine Direct Mill Sacks',
    standard50kg: 'Standard 50kg',

    // Featured Bags
    featuredRedTitle: 'Radhe Krishna Bypass Protein',
    featuredRedSub: 'Red & Yellow Bag (50 kg)',
    featuredTurqTitle: 'Radhe Krishna Ekstrapro',
    featuredTurqSub: 'Turquoise & Yellow Bag (50 kg)',

    // Product Section
    catalogTitle: 'Branded Cattle Feed Catalogue',
    catalogSubtitle: 'Manufactured by Krishna Agrovet. Genuine 50kg sacks and dairy nutrition.',
    filterAll: 'All Feeds',
    filterBrand: 'Brand',
    filterWeight: 'Bag Weight',
    filterInStockOnly: 'In-Stock Only',
    sortLabel: 'Sort by:',
    sortFeatured: 'Featured for Dairy',
    sortName: 'Product Name (A-Z)',
    sortWeight: 'Bag Weight (Heaviest First)',
    perBag: 'per bag',
    bagWeightUnit: 'kg Bag',
    rateOnWhatsApp: 'Rate on WhatsApp',
    bagUnit: 'kg Bag',
    inStockText: 'In Stock',
    lowStockText: 'Low Stock',
    outOfStockText: 'Out of Stock',
    addBagBtn: 'Add Bag(s)',
    addedBtn: 'Added!',
    maxInCart: 'Max in Cart',
    viewDetails: 'View Nutritional Breakdown & Feeding Guide',
    noProductsFound: 'No cattle feed matches your filters',
    resetFilters: 'Reset All Filters',

    // Modal Details
    modalTitle: 'Product Details',
    nutritionSpecs: 'Nutritional Specifications',
    feedingGuide: 'Feeding & Dosage Guide',
    guaranteedWeight: 'Guaranteed 50 KG Net Weight',

    // Cart Drawer & Page
    cartTitle: 'Your Feed Shopping Cart',
    cartEmpty: 'Your cart is currently empty',
    cartEmptyDesc: 'Add Bypass Protein or Ekstrapro 50kg bags from our catalog to get started.',
    exploreProductsBtn: 'Explore Products',
    freeDeliveryUnlocked: 'Doorstep Farm Delivery',
    addMoreBagsForFree: 'Doorstep Farm Delivery',
    totalSacks: 'Total Sacks',
    totalNetWeight: 'Total Net Weight',
    subtotal: 'Item Subtotal',
    deliveryCharges: 'Farm Delivery Fee',
    freeText: 'Doorstep Delivery',
    totalOrderAmount: 'Total Amount',
    proceedCheckout: 'Enter Delivery Address & Order',
    directWhatsAppInquiry: 'Discuss Wholesale Price on WhatsApp',
    clearCart: 'Clear Cart',
    stickyCartTitle: 'In Cart',
    stickyProceed: 'Checkout',

    // Checkout
    checkoutTitle: 'Farm Delivery Address & Order',
    checkoutSubtitle: 'Enter your farm details. After saving your order, WhatsApp will open with the full details prefilled.',
    nameLabel: 'Farmer / Dairy Owner Name',
    namePlaceholder: 'e.g. Rameshwar Yadav',
    phoneLabel: '10-Digit Mobile Number (WhatsApp)',
    phonePlaceholder: '98290XXXXX',
    villageLabel: 'Village / Gram Panchayat / Town',
    villagePlaceholder: 'e.g. Gram Machari, Tehsil Raini',
    addressLabel: 'Full Delivery Address / Shed Location',
    addressPlaceholder: 'Near Mandi, Yadav Mohalla, Gaushala Road',
    landmarkLabel: 'Nearby Landmark',
    landmarkPlaceholder: 'e.g. Near Gopinath Temple or School',
    pinLabel: '6-Digit PIN Code',
    pinPlaceholder: '301408',
    districtLabel: 'District',
    stateLabel: 'State',
    notesLabel: 'Delivery Instructions (Optional)',
    notesPlaceholder: 'Deliver before 8 AM, tractor access is clear',
    paymentLabel: 'Payment Method',
    codText: 'Cash on Delivery (Pay when bags arrive)',
    submitOrderBtn: 'Save Order & Open WhatsApp Confirmation',
    orderSavingNote: 'Your order is securely registered in our system before WhatsApp opens.',

    // Order Confirmation
    orderConfirmedTitle: 'Order Placed Successfully!',
    orderIdText: 'Order Number',
    importantStepTitle: 'Important: Tap Send in WhatsApp',
    importantStepDesc: 'Your order is recorded in our system. Please tap the green button below and press "Send" in WhatsApp to confirm dispatch with the owner.',
    openWhatsAppBtn: 'Open WhatsApp & Send Order',
    copyMessageBtn: 'Copy WhatsApp Message',
    copiedText: 'Copied to Clipboard!',
    printReceipt: 'Print Order Slip',

    // Brand Story
    aboutBadgeText: 'BRAND STORY • KRISHNA AGROVET',
    aboutTitle: 'About Radhe Krishna Pashu Aahar',
    aboutSubtitle: 'Manufactured by Krishna Agrovet with strict quality standards for high-yielding dairy cattle.',
    aboutPara1: 'Radhe Krishna Pashu Aahar is formulated and produced by Krishna Agrovet to provide dairy farmers with superior, consistent animal nutrition. Our two signature lines — Bypass Protein (बाईपास) and Ekstrapro (एक्स्ट्राप्रो) — are crafted to maximize daily milk yield, maintain peak lactation, and improve butterfat test percentages.',
    aboutPara2: 'Every sack delivers guaranteed 50 kg net weight, clean moisture-barrier packaging, and direct-from-mill freshness. We provide direct farm delivery across rural village blocks and Gaushalas.',
    fact1Title: '50 KG Standard Packing',
    fact1Sub: '50 KG Net Weight',
    fact1Desc: 'Uniform, full-weight woven polypropylene sacks with moisture-resistant lining.',
    fact2Title: 'Signature Formulations',
    fact2Sub: 'Bypass & Ekstrapro',
    fact2Desc: 'Bypass Protein (Red & Yellow bag) and Ekstrapro (Turquoise & Yellow bag) designed for dairy cows & Murrah buffaloes.',
    fact3Title: 'Rural Doorstep Delivery',
    fact3Sub: 'Cattle Shed Unloading',
    fact3Desc: 'Direct vehicle delivery across rural village blocks and neighboring Gram Panchayats.',
    fact4Title: 'WhatsApp Ordering',
    fact4Sub: 'Direct Mill Owner Chat',
    fact4Desc: 'Instant order coordination directly with the mill owner with Cash on Delivery payment.',
    aboutCtaWhatsApp: 'Inquire on WhatsApp',

    // Trust & Benefits
    trustTag: 'Why Farmers Trust Us',
    trustTitle: 'Scientific Cattle Nutrition for Dairy Success',
    whyUsSubtitle: 'Every extra 0.5% in milk fat directly increases your daily dairy payment rate at the village collection center.',
    trustFeat1Title: 'Bypass Protein Technology',
    trustFeat1Desc: 'Rumen-protected proteins pass safely to the abomasum, directly boosting milk production and butterfat.',
    trustFeat2Title: 'Ekstrapro High Energy Balance',
    trustFeat2Desc: 'Nutrient-dense formulation designed for high-yielding crossbred cows and Murrah buffaloes.',
    trustFeat3Title: 'Guaranteed 50 KG Net Weight',
    trustFeat3Desc: 'Full 50kg standard weight per bag with strong stitching and moisture-resistant woven packaging.',
    trustFeat4Title: 'Direct Farm Unloading',
    trustFeat4Desc: 'Convenient tractor/tempo delivery directly to your cattle shed across local Gram Panchayats.',
    trustFeat5Title: 'Cash on Delivery (COD)',
    trustFeat5Desc: 'Pay cash only after inspecting your 50kg bags at your farm or village shed.',
    trustFeat6Title: 'Cattle Vigor & Health',
    trustFeat6Desc: 'Balanced essential minerals and amino acids protect high-yielding cows from post-calving stress.',

    // Delivery Coverage
    deliveryPill: 'Farm-to-Farm Village Logistics',
    deliveryTitle: 'Direct Delivery to Your Farm, Gaushala, or Village Mandi',
    deliveryPara: 'We deliver 50 kg cattle feed sacks directly to your doorstep across rural blocks. Our dedicated delivery tempo ensures your bags arrive dry, clean, and stacked right where your cattle feed is stored.',
    deliveryActiveCoverage: 'Active Delivery Coverage',
    deliverySameDay: 'Same/Next Day Farm Dispatch',
    deliveryFreeThreshold: 'Direct Doorstep Farm Delivery',
    deliveryUrgentTitle: 'Need Fast Feed Delivery Today?',
    deliveryUrgentDesc: 'If your dairy feed stock has run out or you require a bulk load (20+ bags), call or message our owner directly for expedited dispatch.',
    deliveryCallBtn: 'Call',
    deliveryMessageBtn: 'Message on WhatsApp',

    // Footer
    footerDesc: 'Radhe Krishna Pashu Aahar • Manufactured by KRISHNA AGROVET. Quality 50 kg cattle feed sacks, Bypass Protein, Ekstrapro, and dairy supplements.',
    footerQuickLinks: 'Quick Navigation',
    footerDispatch: 'Farm Dispatch Timings',
    footerContact: 'Direct Contact',
    footerRights: 'All rights reserved.',
    footerSacksLinkTitle: 'Signature Feeds (50 KG)',
    footerQualityLink: 'Feed Quality & Nutrition',
    footerBrandStoryLink: 'Brand Story & Mill History',
    footerDeliveryAreasLink: 'Rural Village Delivery Areas',
    footerGenuineAssurance: '100% Genuine 50 KG Mill Packaging',
    footerDoorstepTitle: 'Doorstep Village Delivery:',
    footerDoorstepDesc: 'Transport directly to your cattle shed and Gaushala.',
    footerDispatchSchedTitle: 'Dispatch Schedule:',
    footerDispatchSchedDesc: 'Morning & evening dispatch across rural routes.',
    footerOfficeAddressTitle: 'Registered Office Address:',
    footerManufacturingTitle: 'Manufacturing Mill:',

    // Photo Consultation
    consultationNavBtn: 'Photo Advice',
    consultationTag: 'Photo Consultation • Upload from Device',
    consultationTitle: 'Feed Consultation: Upload Photo from Device',
    consultationSubtitle: 'Take a photo of your dairy cattle, current feed sack, or veterinarian prescription to receive personalized feed recommendations on WhatsApp.',
    consultPhotoLabel: 'Choose Photo from Device / Camera *',
    consultPhotoSub: 'JPG, PNG, WebP (Smartphone Camera or Gallery)',
    consultTypeLabel: 'Photo Category',
    consultType1: 'Milch Cow or Buffalo',
    consultType2: 'Current Feed Sack / Nutrition Label',
    consultType3: 'Veterinarian Slip / Milk Fat Test',
    consultMilkYield: 'Daily Milk Yield (Liters/day)',
    consultWhatsAppBtn: 'Send for Advice on WhatsApp',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
      return 'hi'; // Default to Hindi for welcoming regional farmers!
    } catch {
      return 'hi';
    }
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'hi' ? 'en' : 'hi');
  };

  const t = (key: string): string => {
    return DICTIONARY[lang]?.[key] || DICTIONARY['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
