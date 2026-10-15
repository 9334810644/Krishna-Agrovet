import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../lib/firebase';
import { Order } from '../types';
import { createWhatsAppOrderUrl, formatOrderWhatsAppMessage } from '../lib/whatsapp';
import { 
  CheckCircle2, MessageCircle, Printer, Copy, Check, 
  Phone, ArrowRight, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { settings } = useStoreSettings();
  const { lang, t } = useLanguage();

  const [order, setOrder] = useState<Order | null>(() => {
    return (location.state as any)?.order || null;
  });
  const [loading, setLoading] = useState<boolean>(!order);
  const [copied, setCopied] = useState<boolean>(false);

  // Load order from DB if not already passed in router state
  useEffect(() => {
    const fetchOrder = async () => {
      if (!order && orderNumber) {
        setLoading(true);
        try {
          const found = await dataService.getOrderByNumber(orderNumber);
          if (found) setOrder(found);
        } catch (err) {
          console.error('Error fetching confirmed order:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrder();
  }, [order, orderNumber]);

  // Trigger celebration confetti
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#B82025', '#F5C900', '#079DA5', '#292820'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center bg-warm-cream min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="space-y-3">
          <div className="w-12 h-12 border-4 border-krishna-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-deep-charcoal font-bold">Loading your confirmed order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center bg-warm-cream min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-8 max-w-md w-full shadow-md space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black font-heading text-deep-charcoal">Order Not Found</h2>
          <p className="text-xs text-charcoal-muted">
            We could not locate order details for "{orderNumber}".
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal rounded-xl text-xs font-black border border-brand-yellow-dark"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const whatsAppUrl = createWhatsAppOrderUrl(order, settings.owner_whatsapp, settings.business_name, lang);
  const formattedMessage = formatOrderWhatsAppMessage(order, settings.business_name, lang);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-8 sm:py-12 lg:py-16 bg-warm-cream min-h-[calc(100vh-200px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Success Header Box */}
        <div className="bg-white rounded-3xl border-2 border-brand-yellow p-6 sm:p-8 text-center shadow-md space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-krishna-red tracking-widest">
              KRISHNA AGROVET • ORDER REGISTERED
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-deep-charcoal">
              {t('orderConfirmedTitle')}
            </h1>
            <p className="text-sm font-bold text-charcoal-muted">
              {t('orderIdText')}: <span className="font-mono text-krishna-red font-black text-base">{order.order_number}</span>
            </p>
          </div>

          {/* CRITICAL STEP CALLOUT: Explain customer must press Send in WhatsApp */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 text-left max-w-2xl mx-auto space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm sm:text-base">
              <MessageCircle className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{t('importantStepTitle')}</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
              {t('importantStepDesc')}
            </p>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-base sm:text-lg rounded-xl shadow-lg transition-all active:scale-98"
            >
              <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
              <span>{t('openWhatsAppBtn')}</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal text-xs font-bold rounded-xl border border-warm-cream-dark transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t('copiedText') : t('copyMessageBtn')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal text-xs font-bold rounded-xl border border-warm-cream-dark transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('printReceipt')}</span>
            </button>
          </div>
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-warm-cream-dark pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={settings.logo_url || "/images/krishna-agrovet-logo.png"}
                alt="Krishna Agrovet"
                className="w-12 h-12 object-contain bg-white rounded-xl border border-warm-cream-dark p-1 shadow-xs shrink-0"
              />
              <div>
                <span className="text-[10px] uppercase font-black text-krishna-red tracking-wider">
                  RADHE KRISHNA PASHU AAHAR • KRISHNA AGROVET
                </span>
                <h2 className="text-lg font-black font-heading text-deep-charcoal">
                  Order Receipt & Farm Dispatch Slip
                </h2>
              </div>
            </div>
            <span className="text-xs font-bold text-charcoal-muted">
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Customer & Address Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-warm-cream/50 p-4 rounded-2xl border border-warm-cream-dark text-xs text-deep-charcoal">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-charcoal-muted block">
                Farmer / Buyer
              </span>
              <p className="font-bold text-sm">{order.customer_name}</p>
              <p className="font-mono text-charcoal-muted font-bold">+91 {order.customer_phone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-charcoal-muted block">
                Farm Delivery Location
              </span>
              <p className="font-bold">{order.village_town}</p>
              <p className="text-charcoal-muted">{order.full_address}</p>
              <p className="font-mono text-charcoal-muted">PIN: {order.pincode} • {order.district}, {order.state}</p>
              {order.delivery_notes && (
                <p className="text-krishna-red font-semibold italic mt-1">Note: "{order.delivery_notes}"</p>
              )}
              {order.landmark_photo_url && (
                <div className="pt-2 flex items-center gap-2.5">
                  <img
                    src={order.landmark_photo_url}
                    alt="Farm Gate / Landmark"
                    className="w-14 h-14 object-cover rounded-xl border border-warm-cream-dark shadow-xs shrink-0"
                  />
                  <div className="text-[11px] text-charcoal-muted leading-tight">
                    <span className="font-bold text-deep-charcoal block">Farm Landmark Photo Attached</span>
                    <span>Provided for tempo driver delivery reference</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Bags Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
              Cattle Feed Bags Ordered
            </h3>
            
            <div className="border border-warm-cream-dark rounded-2xl overflow-hidden divide-y divide-warm-cream-dark">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold text-deep-charcoal block truncate">
                      {item.product_name}
                    </span>
                    <span className="text-xs text-charcoal-muted">
                      {item.bag_weight_kg}kg Standard Sack • Qty: <strong>{item.quantity} Bags</strong>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-krishna-red bg-krishna-red/10 px-2.5 py-1 rounded-md">
                      Rate on WhatsApp
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Totals */}
          <div className="pt-3 border-t border-warm-cream-dark space-y-2 text-xs font-bold text-charcoal-muted">
            <div className="flex justify-between">
              <span>Total Cattle Feed Bags:</span>
              <span className="font-black text-deep-charcoal">{order.total_bags} Bags ({order.total_bags * 50} kg)</span>
            </div>
            <div className="flex justify-between">
              <span>Farm Doorstep Delivery:</span>
              <span className="text-deep-charcoal font-black">
                Doorstep Farm Delivery
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-warm-cream-dark text-sm sm:text-base font-black text-deep-charcoal">
              <span>कीमत / Pricing:</span>
              <span className="text-krishna-red font-heading font-black">
                व्हाट्सएप पर चर्चा / Rate on WhatsApp
              </span>
            </div>
          </div>

          {/* Help box */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal-muted bg-warm-cream p-4 rounded-2xl border border-warm-cream-dark">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-krishna-red" />
              <span>Helpline for dispatch inquiries: <strong>{settings.owner_phone}</strong></span>
            </div>
            <Link
              to="/#products"
              className="inline-flex items-center gap-1.5 font-bold text-krishna-red hover:underline"
            >
              <span>Explore More Feeds</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
