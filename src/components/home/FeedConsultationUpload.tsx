import React, { useState, useRef } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Camera, UploadCloud, MessageCircle, CheckCircle2, 
  Trash2, Sparkles, Loader2, AlertCircle, Download, ArrowRight 
} from 'lucide-react';
import { compressDeviceImage } from '../../lib/imageCompression';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const FeedConsultationUpload: React.FC = () => {
  const { settings } = useStoreSettings();
  const { lang, t } = useLanguage();
  const cleanWhatsApp = normalizeWhatsAppNumber(settings.owner_whatsapp);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Form Fields
  const [farmerName, setFarmerName] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<string>('cow_buffalo');
  const [milkYield, setMilkYield] = useState<string>('12');
  const [farmerQuestion, setFarmerQuestion] = useState<string>('');
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await compressDeviceImage(file, 1000, 0.85);
      setPhotoDataUrl(res.dataUrl);
      setFileName(res.fileName || 'feed-consultation-photo.jpg');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process photo from your device.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClearPhoto = () => {
    setPhotoDataUrl(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadPhoto = () => {
    if (!photoDataUrl) return;
    const a = document.createElement('a');
    a.href = photoDataUrl;
    a.download = fileName || 'cattle-feed-photo.jpg';
    a.click();
  };

  // Build personalized WhatsApp consultation link
  const categoryNames: Record<string, string> = {
    cow_buffalo: lang === 'hi' ? 'दुधारू गाय या भैंस' : 'Milch Cow / Buffalo',
    feed_sack: lang === 'hi' ? 'वर्तमान आहार का कट्टा / लेबल' : 'Current Feed Sack / Brand Label',
    vet_slip: lang === 'hi' ? 'डॉक्टर की पर्ची / फैट टेस्ट' : 'Veterinarian Slip / Fat Test Report',
    other: lang === 'hi' ? 'सामान्य आहार प्रश्न' : 'General Nutrition Question',
  };

  const whatsAppMessage = `Namaste ${settings.business_name},
I want feed consultation for my dairy livestock:
- Farmer: ${farmerName.trim() || 'Dairy Farmer'}
- Village: ${village.trim() || 'Local Area'}
- Photo Type: ${categoryNames[photoCategory] || photoCategory}
- Daily Milk Yield: ${milkYield || '—'} Liters/day
${farmerQuestion.trim() ? `- Question: "${farmerQuestion.trim()}"` : ''}

I am attaching the photo from my device now. Please guide me which Radhe Krishna feed (Bypass Protein / Ekstrapro) will give the best milk yield and fat percentage!`;

  const whatsAppUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(whatsAppMessage)}`;

  const handleSubmitWhatsApp = () => {
    setSubmittedFeedback(true);
    setTimeout(() => setSubmittedFeedback(false), 3000);
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="consultation" className="py-14 sm:py-20 bg-warm-cream border-b border-warm-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-yellow/80 shadow-xs text-krishna-red text-xs sm:text-sm font-bold">
            <Camera className="w-4 h-4 text-krishna-red" />
            <span>{t('consultationTag')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-deep-charcoal mt-3 font-heading tracking-tight">
            {t('consultationTitle')}
          </h2>

          <p className="text-charcoal-muted text-sm sm:text-base mt-2 leading-relaxed">
            {t('consultationSubtitle')}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Device Photo Upload Box */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-deep-charcoal uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-krishna-red" />
                  <span>{t('consultPhotoLabel')}</span>
                </label>
                <span className="text-[11px] text-charcoal-muted font-bold">
                  {t('consultPhotoSub')}
                </span>
              </div>

              {/* Hidden Native File Input (supports mobile camera or gallery) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Dropzone / Preview Area */}
              {!photoDataUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] ${
                    isDragging
                      ? 'border-krishna-red bg-krishna-red/10 scale-102'
                      : 'border-warm-cream-dark hover:border-krishna-red bg-warm-cream/50 hover:bg-warm-cream'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white text-krishna-red border-2 border-warm-cream-dark flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-base font-black text-deep-charcoal font-heading">
                    {lang === 'hi' ? 'डिवाइस से फोटो चुनें या कैमरा खोलें' : 'Choose Photo from Device or Open Camera'}
                  </h3>

                  <p className="text-xs text-charcoal-muted mt-1 max-w-xs leading-relaxed">
                    {lang === 'hi'
                      ? 'अपने मोबाइल या कंप्यूटर से गाय-भैंस, कट्टे या पर्ची की फोटो सेलेक्ट करें।'
                      : 'Tap to browse your gallery, phone storage, or take a fresh photo.'}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl text-xs shadow-sm border border-brand-yellow-dark cursor-pointer active:scale-98"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'फोटो अपलोड करें (कैमरा / गैलरी)' : 'Upload from Device (Camera / Gallery)'}</span>
                  </button>
                </div>
              ) : (
                /* Uploaded Photo Preview Card */
                <div className="relative rounded-3xl overflow-hidden border-2 border-warm-cream-dark bg-stone-900 shadow-md">
                  <div className="aspect-4/3 w-full bg-stone-950 flex items-center justify-center p-2">
                    <img
                      src={photoDataUrl}
                      alt="Uploaded cattle feed consultation photo"
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  {/* Overlay Top Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'फोटो तैयार है' : 'Photo Ready'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="p-1.5 bg-deep-charcoal/85 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shadow-md"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Footer inside preview */}
                  <div className="p-3 bg-white border-t border-warm-cream-dark flex items-center justify-between text-xs">
                    <span className="font-bold text-deep-charcoal truncate max-w-[200px]">
                      {fileName}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadPhoto}
                        className="inline-flex items-center gap-1 text-[11px] text-charcoal-muted hover:text-deep-charcoal font-bold p-1"
                        title="Download compressed copy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'डाउनलोड' : 'Save'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[11px] text-krishna-red hover:underline font-bold"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'बदलें' : 'Change'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips Pill */}
              <div className="bg-warm-cream p-3 rounded-2xl border border-warm-cream-dark flex items-start gap-2.5 text-xs text-charcoal-muted">
                <Sparkles className="w-4 h-4 text-brand-yellow-dark shrink-0 mt-0.5" />
                <span>
                  {lang === 'hi'
                    ? 'फोटो साफ और पर्याप्त रोशनी में लें ताकि हमारे पोषण विशेषज्ञ आहार घटक आसानी से पढ़ सकें।'
                    : 'Take clear photos in good lighting so our feed specialists can inspect the bag formulation and animal condition.'}
                </span>
              </div>

            </div>

            {/* Right Column: Animal / Livestock Details Form */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="border-b border-warm-cream-dark pb-3">
                <h3 className="text-base sm:text-lg font-black font-heading text-deep-charcoal">
                  {lang === 'hi' ? 'पशु व डेयरी विवरण भरें' : 'Enter Livestock & Dairy Details'}
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  {lang === 'hi'
                    ? 'यह जानकारी हमारे विशेषज्ञों को सर्वोत्तम सलाह तैयार करने में मदद करती है।'
                    : 'Helps Krishna Agrovet recommend the exact 50kg bag (Bypass Protein or Ekstrapro).'}
                </p>
              </div>

              {/* Photo Category Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-deep-charcoal uppercase tracking-wider">
                  {t('consultTypeLabel')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoCategory('cow_buffalo')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      photoCategory === 'cow_buffalo'
                        ? 'border-krishna-red bg-krishna-red/10 text-krishna-red shadow-2xs font-black'
                        : 'border-warm-cream-dark bg-warm-cream/50 text-deep-charcoal hover:bg-warm-cream'
                    }`}
                  >
                    🐄 {t('consultType1')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoCategory('feed_sack')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      photoCategory === 'feed_sack'
                        ? 'border-feed-turquoise bg-feed-turquoise/10 text-feed-turquoise-dark shadow-2xs font-black'
                        : 'border-warm-cream-dark bg-warm-cream/50 text-deep-charcoal hover:bg-warm-cream'
                    }`}
                  >
                    📦 {t('consultType2')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoCategory('vet_slip')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      photoCategory === 'vet_slip'
                        ? 'border-brand-yellow-dark bg-brand-yellow/20 text-deep-charcoal shadow-2xs font-black'
                        : 'border-warm-cream-dark bg-warm-cream/50 text-deep-charcoal hover:bg-warm-cream'
                    }`}
                  >
                    📋 {t('consultType3')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoCategory('other')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      photoCategory === 'other'
                        ? 'border-deep-charcoal bg-deep-charcoal/10 text-deep-charcoal shadow-2xs font-black'
                        : 'border-warm-cream-dark bg-warm-cream/50 text-deep-charcoal hover:bg-warm-cream'
                    }`}
                  >
                    ❓ {lang === 'hi' ? 'अन्य सामान्य प्रश्न' : 'Other Inquiries'}
                  </button>
                </div>
              </div>

              {/* Farmer Name & Village */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-deep-charcoal">
                    {lang === 'hi' ? 'किसान / डेयरी का नाम' : 'Farmer / Dairy Name'}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder={lang === 'hi' ? 'उदा. मुकेश शर्मा' : 'e.g. Mukesh Sharma'}
                    className="w-full px-3.5 py-2.5 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs font-medium text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-deep-charcoal">
                    {lang === 'hi' ? 'गांव / कस्बा' : 'Village / Town'}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={lang === 'hi' ? 'उदा. रैणी' : 'e.g. Raini'}
                    className="w-full px-3.5 py-2.5 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs font-medium text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red"
                  />
                </div>
              </div>

              {/* Milk Yield */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-deep-charcoal">
                  {t('consultMilkYield')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={milkYield}
                    onChange={(e) => setMilkYield(e.target.value)}
                    className="w-32 px-3.5 py-2 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs font-black text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-mono"
                  />
                  <span className="text-xs text-charcoal-muted font-bold">Liters per day</span>
                </div>
              </div>

              {/* Question or specific need */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-deep-charcoal">
                  {lang === 'hi' ? 'आपका प्रश्न या विशेष आवश्यकता (वैकल्पिक)' : 'Your Question or Specific Need (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={farmerQuestion}
                  onChange={(e) => setFarmerQuestion(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. फैट 0.5% कम आ रहा है, कौन सा कट्टा शुरू करें?' : 'e.g. Need to improve butterfat test from 3.8 to 4.5%'}
                  className="w-full px-3.5 py-2.5 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs font-medium text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red"
                />
              </div>

              {/* Direct WhatsApp Consultation CTA Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                  <span>{submittedFeedback ? (lang === 'hi' ? 'व्हाट्सएप खुल रहा है...' : 'Opening WhatsApp...') : t('consultWhatsAppBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-charcoal-muted text-center leading-relaxed font-medium">
                  {lang === 'hi'
                    ? '💡 व्हाट्सएप खुलने पर अपनी चुनी हुई फोटो को चैट में अटैच करके सेंड दबाएं। हमारे मालिक तुरंत उत्तर देंगे।'
                    : '💡 When WhatsApp opens, attach your selected photo in the chat and tap send. Our nutritionist will reply promptly.'}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
