import React, { useState, useRef, useEffect } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { 
  Save, 
  Loader2, 
  Check, 
  AlertCircle, 
  Camera, 
  UploadCloud, 
  Trash2, 
  Image as ImageIcon,
  Plus,
  ArrowUp,
  ArrowDown,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CloudLightning,
  Copy
} from 'lucide-react';
import { compressDeviceImage } from '../../lib/imageCompression';
import { 
  getFirebaseConfig,
  getFirebaseConnectionDetails,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  dataService,
  FirebaseConnectionConfig 
} from '../../lib/firebase';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useStoreSettings();
  
  const initialBanners = (settings.hero_banners && settings.hero_banners.length > 0)
    ? settings.hero_banners
    : (settings.hero_banner_url ? [settings.hero_banner_url] : ['/images/banners/radhe-krishna-banner.jpg']);

  const [formData, setFormData] = useState({
    business_name: settings.business_name,
    tagline: settings.tagline,
    owner_whatsapp: settings.owner_whatsapp,
    owner_phone: settings.owner_phone,
    support_email: settings.support_email,
    delivery_areas: settings.delivery_areas,
    office_address: settings.office_address || 'Khasra No. 354/ 1, Patanwa, Industrial area, Ramnagar, Chandauli, ( U. P )',
    min_order_bags: settings.min_order_bags || 1,
    delivery_fee_per_bag: settings.delivery_fee_per_bag || 30,
    free_delivery_threshold_bags: settings.free_delivery_threshold_bags || 5,
    notice_banner_text: settings.notice_banner_text,
    is_store_open: settings.is_store_open,
    logo_url: settings.logo_url || '/images/krishna-agrovet-logo.png',
    hero_banner_url: settings.hero_banner_url || initialBanners[0] || '',
    hero_banners: initialBanners,
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [processingLogo, setProcessingLogo] = useState<boolean>(false);
  const [processingBanner, setProcessingBanner] = useState<boolean>(false);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  // Sync settings when fetched asynchronously
  useEffect(() => {
    if (settings) {
      const banners = (settings.hero_banners && settings.hero_banners.length > 0)
        ? settings.hero_banners
        : (settings.hero_banner_url ? [settings.hero_banner_url] : ['/images/banners/radhe-krishna-banner.jpg']);

      setFormData(prev => ({
        ...prev,
        business_name: settings.business_name || prev.business_name,
        tagline: settings.tagline || prev.tagline,
        owner_whatsapp: settings.owner_whatsapp || prev.owner_whatsapp,
        owner_phone: settings.owner_phone || prev.owner_phone,
        support_email: settings.support_email || prev.support_email,
        delivery_areas: settings.delivery_areas || prev.delivery_areas,
        office_address: settings.office_address || prev.office_address,
        min_order_bags: settings.min_order_bags ?? prev.min_order_bags,
        delivery_fee_per_bag: settings.delivery_fee_per_bag ?? prev.delivery_fee_per_bag,
        free_delivery_threshold_bags: settings.free_delivery_threshold_bags ?? prev.free_delivery_threshold_bags,
        notice_banner_text: settings.notice_banner_text ?? prev.notice_banner_text,
        is_store_open: settings.is_store_open ?? prev.is_store_open,
        logo_url: settings.logo_url || prev.logo_url,
        hero_banner_url: settings.hero_banner_url || banners[0] || '',
        hero_banners: prev.hero_banners.length > 0 && prev.hero_banners !== initialBanners ? prev.hero_banners : banners,
      }));
    }
  }, [settings]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProcessingLogo(true);
      setBrandingError(null);
      try {
        const res = await compressDeviceImage(e.target.files[0], 400, 0.9);
        setFormData(prev => ({ ...prev, logo_url: res.dataUrl }));
      } catch (err: any) {
        setBrandingError(err.message || 'Failed to upload logo.');
      } finally {
        setProcessingLogo(false);
      }
    }
  };

  const handleBannerFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProcessingBanner(true);
      setBrandingError(null);
      try {
        const files = Array.from(e.target.files);
        const compressedList: string[] = [];
        for (const file of files) {
          const res = await compressDeviceImage(file, 1200, 0.85);
          compressedList.push(res.dataUrl);
        }
        setFormData(prev => {
          const updated = [...prev.hero_banners, ...compressedList];
          return {
            ...prev,
            hero_banners: updated,
            hero_banner_url: updated[0] || '',
          };
        });
      } catch (err: any) {
        setBrandingError(err.message || 'Failed to upload banner photos.');
      } finally {
        setProcessingBanner(false);
        if (bannerInputRef.current) {
          bannerInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveBanner = (indexToRemove: number) => {
    setFormData(prev => {
      const updated = prev.hero_banners.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        hero_banners: updated,
        hero_banner_url: updated[0] || '',
      };
    });
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.hero_banners.length) return prev;
      const updated = [...prev.hero_banners];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return {
        ...prev,
        hero_banners: updated,
        hero_banner_url: updated[0] || '',
      };
    });
  };

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Firebase & Cloud Firestore Live Hub State
  const [firebaseDetails, setFirebaseDetails] = useState(() => getFirebaseConnectionDetails());
  const [fbConfig, setFbConfig] = useState<FirebaseConnectionConfig>(() => getFirebaseConfig());
  const [showConfigEditor, setShowConfigEditor] = useState<boolean>(!firebaseDetails.isConfigured);
  const [showRulesGuide, setShowRulesGuide] = useState<boolean>(false);
  const [testingFirebase, setTestingFirebase] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; projectId: string | null } | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setTestResult(null);
    try {
      const res = await dataService.testFirestoreConnection();
      setTestResult(res);
      setFirebaseDetails(getFirebaseConnectionDetails());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error executing connection test.',
        projectId: null,
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleSyncToFirestore = async () => {
    setSyncingFirestore(true);
    setSyncResult(null);
    try {
      const res = await dataService.syncAllToFirestore();
      setSyncResult({
        success: true,
        message: `Successfully uploaded ${res.productsCount} products, ${res.categoriesCount} categories, and store settings to Cloud Firestore!`,
      });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Failed to sync data to Firestore.',
      });
    } finally {
      setSyncingFirestore(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig(fbConfig);
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm('Clear custom credentials and revert to environment defaults?')) {
      clearCustomFirebaseConfig();
    }
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'krishnaagrovet@gmail.com' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }
    match /_connection_test/{docId} {
      allow read, write: if true;
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin() || (
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['available_stock', 'updated_at'])
      );
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /store_settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /orders/{orderId} {
      allow create: if request.resource.data.customer_name != null
                    && request.resource.data.customer_phone != null
                    && request.resource.data.full_address != null
                    && request.resource.data.total_bags > 0;
      allow read: if true;
      allow update, delete: if isAdmin();
    }
    match /inventory_movements/{movementId} {
      allow read: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if isAdmin();
    }
    match /admins/{adminId} {
      allow read: if request.auth != null && (request.auth.uid == adminId || isAdmin());
      allow write: if isAdmin();
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        hero_banner_url: formData.hero_banners[0] || '',
      };
      await updateSettings(payload);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Error updating store settings:', err);
      setErrorMsg(err.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            KRISHNA AGROVET
          </span>
          <span className="text-xs font-bold text-charcoal-muted">Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
          Store Configuration & Database
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
          Connect Cloud Firestore for real-time multi-device sync, edit mill brand identity, and WhatsApp hotline.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-700" />
          <span>Store settings saved successfully across storefront and database!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FIREBASE & CLOUD FIRESTORE LIVE HUB */}
      {/* ========================================================================= */}
      <div className={`rounded-3xl border-2 p-5 sm:p-7 shadow-sm transition-all ${
        firebaseDetails.isConfigured 
          ? 'bg-gradient-to-br from-emerald-500/5 via-white to-warm-cream/40 border-emerald-300 shadow-emerald-500/5'
          : 'bg-gradient-to-br from-amber-500/5 via-white to-warm-cream/40 border-amber-300 shadow-amber-500/5'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              firebaseDetails.isConfigured 
                ? 'bg-emerald-600 text-white border-emerald-700' 
                : 'bg-amber-500 text-white border-amber-600'
            }`}>
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  firebaseDetails.isConfigured 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${firebaseDetails.isConfigured ? 'bg-emerald-600 animate-ping' : 'bg-amber-500'}`} />
                  {firebaseDetails.isConfigured ? 'Cloud Firestore Connected' : 'Local Storage Mode'}
                </span>

                {firebaseDetails.projectId && (
                  <span className="text-xs font-mono font-bold text-deep-charcoal bg-white px-2 py-0.5 rounded-md border border-warm-cream-dark">
                    Project: {firebaseDetails.projectId}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-deep-charcoal font-heading mt-1">
                {firebaseDetails.isConfigured 
                  ? 'Real-Time Cloud Firestore Database Active' 
                  : 'Connect Firebase for Real-Time Cloud Storage'}
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5 max-w-2xl">
                {firebaseDetails.isConfigured
                  ? 'All changes to products, inventory stock, orders, and store settings sync instantaneously across all devices and phones using Firestore onSnapshot listeners.'
                  : 'Currently running on persistent browser local storage. Connect your Firebase credentials to enable live real-time sync across mobile phones and devices.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={handleTestFirebase}
              disabled={testingFirebase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-warm-cream text-deep-charcoal border-2 border-warm-cream-dark rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
              <span>{testingFirebase ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {firebaseDetails.isConfigured && (
              <button
                type="button"
                onClick={handleSyncToFirestore}
                disabled={syncingFirestore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CloudLightning className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-spin' : ''}`} />
                <span>{syncingFirestore ? 'Syncing...' : 'Sync Local Data to Firestore'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal border border-warm-cream-dark rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-krishna-red" />
              <span>{showConfigEditor ? 'Hide Credentials' : 'Edit Credentials'}</span>
              {showConfigEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2.5 animate-fadeIn ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="block">{testResult.message}</span>
              {!testResult.success && (
                <span className="block text-[11px] font-normal text-rose-700">
                  Tip: Check that Firestore Database is created in test mode or security rules allow read/write.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sync Result Banner */}
        {syncResult && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2.5 animate-fadeIn ${
            syncResult.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{syncResult.message}</span>
          </div>
        )}

        {/* Credentials Editor Drawer */}
        {showConfigEditor && (
          <form onSubmit={handleSaveFirebaseConfig} className="mt-5 pt-5 border-t border-warm-cream-dark/60 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-deep-charcoal font-heading">
                  Firebase Web Client Credentials
                </h3>
                <p className="text-[11px] text-charcoal-muted">
                  Paste your Firebase web app config from Firebase Console → Project Settings → General → Web App.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRulesGuide(!showRulesGuide)}
                className="text-xs font-bold text-krishna-red hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{showRulesGuide ? 'Hide Rules Guide' : 'View Firestore Security Rules Guide'}</span>
              </button>
            </div>

            {/* Quick collapsible guide for Firestore rules */}
            {showRulesGuide && (
              <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark space-y-3 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-deep-charcoal">Recommended Firestore Security Rules (Development / MVP)</span>
                  <button
                    type="button"
                    onClick={handleCopyRules}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                  </button>
                </div>
                <pre className="bg-deep-charcoal text-white p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {firestoreRulesCode}
                </pre>
                <p className="text-[11px] text-charcoal-muted">
                  Paste these rules in <strong>Firebase Console → Firestore Database → Rules tab → Publish</strong> to allow web reads and writes.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">Project ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. krishna-agrovet-12345"
                  value={fbConfig.projectId}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">API Key *</label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={fbConfig.apiKey}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">Auth Domain</label>
                <input
                  type="text"
                  placeholder="e.g. krishna-agrovet.firebaseapp.com"
                  value={fbConfig.authDomain}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">Storage Bucket</label>
                <input
                  type="text"
                  placeholder="e.g. krishna-agrovet.appspot.com"
                  value={fbConfig.storageBucket}
                  onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">Messaging Sender ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1029384756"
                  value={fbConfig.messagingSenderId}
                  onChange={(e) => setFbConfig({ ...fbConfig, messagingSenderId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">App ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1:1029384756:web:abcd1234"
                  value={fbConfig.appId}
                  onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deep-charcoal">Measurement ID (Analytics)</label>
                <input
                  type="text"
                  placeholder="e.g. G-JWQ62BTNV5"
                  value={fbConfig.measurementId || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, measurementId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-white text-xs font-mono focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <span className="text-[11px] text-charcoal-muted">
                Credentials can also be stored permanently in your project root <code className="bg-warm-cream px-1.5 py-0.5 rounded text-deep-charcoal font-bold">.env</code> file.
              </span>

              <div className="flex items-center gap-2">
                {firebaseDetails.source === 'custom' && (
                  <button
                    type="button"
                    onClick={handleClearFirebaseConfig}
                    className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear Custom Credentials
                  </button>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-deep-charcoal hover:bg-black text-white rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Save & Connect Firebase</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-warm-cream-dark p-4 sm:p-8 shadow-sm space-y-6 text-xs">
        
        {/* Business Identity */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-deep-charcoal font-heading border-b border-warm-cream-dark pb-3">
            Business Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Business / Store Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-bold text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Business Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-medium text-deep-charcoal"
              />
            </div>
          </div>

          {/* Store Logo & Hero Banner Images Upload */}
          <div className="space-y-4 pt-4 border-t border-warm-cream-dark">
            <div>
              <h3 className="text-sm font-black text-deep-charcoal font-heading">
                Store Branding & Photos (दुकान का लोगो और बैनर फोटो)
              </h3>
              <p className="text-charcoal-muted text-[11px] mt-0.5">
                Upload logo and promotional banners directly from your phone camera or gallery. Photos are automatically compressed for ultra-fast loading.
              </p>
            </div>

            {brandingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{brandingError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Store Logo Upload */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-warm-cream-dark bg-warm-cream/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-deep-charcoal block">Store Logo / Emblem (दुकान का लोगो)</span>
                    <span className="text-[10px] text-charcoal-muted">Shown in header & navigation</span>
                  </div>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />

                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative group shrink-0">
                      <img
                        src={formData.logo_url}
                        alt="Store Logo Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-yellow shadow-md"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Preview
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-warm-cream border-2 border-warm-cream-dark flex flex-col items-center justify-center text-charcoal-muted shrink-0">
                      <Camera className="w-5 h-5 text-charcoal-muted/60 mb-0.5" />
                      <span className="text-[9px] font-bold">No Logo</span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      disabled={processingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-warm-cream-dark hover:border-krishna-red text-deep-charcoal font-bold text-xs shadow-xs hover:bg-warm-cream transition-all cursor-pointer"
                    >
                      {processingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-krishna-red" />
                          <span>Compressing...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-krishna-red" />
                          <span>{formData.logo_url ? 'Change Logo Photo' : 'Upload from Device'}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-charcoal-muted leading-tight">
                      Pick image from phone gallery or take photo with camera.
                    </p>
                  </div>
                </div>
              </div>

              {/* Multiple Hero Banners Upload & Management Card */}
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-warm-cream-dark bg-warm-cream/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-cream-dark/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-deep-charcoal text-sm">Hero Banners (मुख्य बैनर - स्लाइडर)</span>
                      <span className="bg-krishna-red/10 text-krishna-red text-[11px] font-black px-2 py-0.5 rounded-full">
                        {formData.hero_banners.length} {formData.hero_banners.length === 1 ? 'Banner' : 'Banners'}
                      </span>
                    </div>
                    <span className="text-[11px] text-charcoal-muted block mt-0.5">
                      Banners rotate automatically in the top slider on the homepage. Add multiple banners to showcase offers & products.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBannerFilesChange}
                    />

                    <button
                      type="button"
                      disabled={processingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-krishna-red hover:bg-krishna-red-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {processingBanner ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Compressing...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Banner Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Banner list */}
                {formData.hero_banners.length > 0 ? (
                  <div className="space-y-3">
                    {formData.hero_banners.map((bannerUrl, index) => (
                      <div
                        key={`banner-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-warm-cream-dark shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Banner Preview Thumbnail */}
                          <div className="relative group rounded-lg overflow-hidden border border-warm-cream-dark shadow-xs h-16 w-32 sm:w-44 shrink-0 bg-neutral-900">
                            <img
                              src={bannerUrl}
                              alt={`Banner ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              Preview
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-deep-charcoal">
                                Banner #{index + 1}
                              </span>
                              {index === 0 && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                                  Primary (सबसे पहले दिखेगा)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-charcoal-muted">
                              {index === 0
                                ? 'Displays first on website load.'
                                : `Slides in order position #${index + 1}.`}
                            </p>
                          </div>
                        </div>

                        {/* Order & Remove Controls */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-cream">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveBanner(index, 'up')}
                            title="Move Up in Slider Order"
                            className="p-1.5 rounded-lg border border-warm-cream-dark bg-white hover:bg-warm-cream text-deep-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formData.hero_banners.length - 1}
                            onClick={() => handleMoveBanner(index, 'down')}
                            title="Move Down in Slider Order"
                            className="p-1.5 rounded-lg border border-warm-cream-dark bg-white hover:bg-warm-cream text-deep-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(index)}
                            title="Remove this banner"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors text-xs font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-warm-cream border-2 border-dashed border-warm-cream-dark text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-charcoal-muted/60 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-deep-charcoal">
                        No custom banners uploaded
                      </p>
                      <p className="text-[11px] text-charcoal-muted">
                        Default Radhe Krishna cattle feed banner is active on homepage. Click below to add your promotional banners.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={processingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-krishna-red hover:bg-krishna-red-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Banner from Device</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-charcoal-muted pt-1">
                  <span>
                    💡 You can select multiple images at once. Use ↑ / ↓ buttons to rearrange display sequence.
                  </span>
                  {formData.hero_banners.length > 0 && (
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="text-krishna-red hover:underline font-bold text-xs inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add another banner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Contact */}
        <div className="space-y-4 pt-2 border-t border-warm-cream-dark">
          <h2 className="text-base font-black text-deep-charcoal font-heading border-b border-warm-cream-dark pb-3">
            Owner WhatsApp & Telephone
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Owner WhatsApp (Digits only) *</label>
              <input
                type="text"
                required
                placeholder="919470847471"
                value={formData.owner_whatsapp}
                onChange={(e) => setFormData({ ...formData, owner_whatsapp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-mono font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Display Telephone *</label>
              <input
                type="text"
                required
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-bold focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-deep-charcoal">Support Email</label>
              <input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-deep-charcoal">Registered Office Address</label>
              <textarea
                rows={2}
                value={formData.office_address}
                onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red text-deep-charcoal"
                placeholder="Khasra No. 354/ 1, Patanwa, Industrial area, Ramnagar, Chandauli, ( U. P )"
              />
            </div>
          </div>
        </div>


        {/* Notice Banner */}
        <div className="space-y-1 pt-2 border-t border-warm-cream-dark">
          <label className="font-bold text-deep-charcoal">Top Notice / Delivery Banner Text</label>
          <input
            type="text"
            value={formData.notice_banner_text}
            onChange={(e) => setFormData({ ...formData, notice_banner_text: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs focus:ring-1 focus:ring-krishna-red font-medium text-deep-charcoal"
          />
        </div>

        <div className="pt-4 border-t border-warm-cream-dark flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl shadow-md transition-colors border-2 border-brand-yellow-dark cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Configuration</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
