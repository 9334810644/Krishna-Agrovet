import { Order, Product } from '../types';

/**
 * Normalizes phone number into international digits-only format for WhatsApp wa.me link.
 * Example: "+91 94708 47471" or "09470847471" -> "919470847471"
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '919470847471';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean;
}

/**
 * Builds the direct WhatsApp inquiry URL from Cart items with pre-filled message in selected language
 */
export function createCartWhatsAppUrl(
  items: { product: Product; quantity: number }[],
  ownerWhatsAppNumber: string,
  businessName: string = 'Radhe Krishna Pashu Aahar',
  lang: 'hi' | 'en' = 'hi'
): string {
  const cleanNumber = normalizeWhatsAppNumber(ownerWhatsAppNumber);
  const totalBags = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = items.reduce((sum, item) => sum + item.quantity * (item.product.bag_weight_kg || 50), 0);
  const isHindi = lang === 'hi';

  const itemsText = items
    .map((item, idx) => {
      const weight = item.product.bag_weight_kg || 50;
      if (isHindi) {
        return `${idx + 1}. *${item.product.name}*\n   ${weight} किग्रा बोरी | मात्रा: *${item.quantity} बैग* (${item.quantity * weight} किग्रा)`;
      }
      return `${idx + 1}. *${item.product.name}*\n   ${weight}kg Sack | Qty: *${item.quantity} Bags* (${item.quantity * weight} kg)`;
    })
    .join('\n');

  if (isHindi) {
    const message = `🌾 *पशु आहार पूछताछ* 🌾
*${businessName.toUpperCase()} (कृष्णा एग्रोवेट)*

नमस्ते, मैं अपनी डेयरी के लिए निम्नलिखित पशु आहार बोरियों के ऑर्डर और डिलीवरी के संबंध में चर्चा करना चाहता हूं:

📦 *चयनित उत्पाद:*
${itemsText}

📊 *कुल बोरियां:* *${totalBags} बैग* (${totalWeightKg} किग्रा)
💰 *कीमत / भाव:* व्हाट्सएप पर चर्चा
कृपया आज का डिस्काउंट भाव, टेम्पो डिलीवरी और डिस्पैच का समय बताएं।`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  // English version
  const message = `🌾 *CATTLE FEED INQUIRY* 🌾
*${businessName.toUpperCase()} (KRISHNA AGROVET)*

Hello, I would like to inquire about ordering and doorstep delivery of the following cattle feed sacks for my dairy farm:

📦 *Selected Products:*
${itemsText}

📊 *Total Sacks:* *${totalBags} Bags* (${totalWeightKg} kg)
💰 *Price / Rate:* Rate on WhatsApp
Please share today's wholesale rate, tempo delivery schedule, and dispatch timing.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats a clean, readable, professional order message in English or Hindi according to selected language
 */
export function formatOrderWhatsAppMessage(
  order: Order,
  businessName: string = 'Radhe Krishna Pashu Aahar',
  lang: 'hi' | 'en' = 'hi'
): string {
  const isHindi = lang === 'hi';

  const itemsText = (order.items || [])
    .map((item, index) => {
      const weight = item.bag_weight_kg || 50;
      if (isHindi) {
        return `${index + 1}. *${item.product_name}*\n   ${weight} किग्रा बोरी | मात्रा: *${item.quantity} बैग* (${item.quantity * weight} किग्रा)`;
      }
      return `${index + 1}. *${item.product_name}*\n   ${weight}kg Sack | Qty: *${item.quantity} Bags* (${item.quantity * weight} kg)`;
    })
    .join('\n');

  if (isHindi) {
    const formattedDate = new Date(order.created_at).toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentText = order.payment_method === 'cash_on_delivery'
      ? 'डिलीवरी पर नकद (Cash on Delivery)'
      : order.payment_method;

    return `🌾 *नया पशु आहार ऑर्डर* 🌾
*${businessName.toUpperCase()} (कृष्णा एग्रोवेट)*

📋 *ऑर्डर संख्या (Order ID):* ${order.order_number}
📅 *दिनांक व समय:* ${formattedDate}

👤 *किसान / ग्राहक विवरण:*
• नाम: *${order.customer_name}*
• मोबाइल नंबर: *${order.customer_phone}*
• गांव / कस्बा: *${order.village_town}*
• पहचान चिन्ह (Landmark): ${order.landmark || 'उल्लेखित नहीं'}
• पूरा पता: ${order.full_address}
• पिन कोड: ${order.pincode}
• जिला व राज्य: ${order.district}, ${order.state}
${order.delivery_notes ? `• डिलीवरी निर्देश: _"${order.delivery_notes}"_\n` : ''}
📦 *ऑर्डर की गई बोरियां:*
${itemsText}

📊 *ऑर्डर सारांश:*
• कुल बोरियां: *${order.total_bags} बैग* (${order.total_bags * 50} किग्रा)
• कीमत / भाव: *व्हाट्सएप पर चर्चा*
• फार्म डिलीवरी: *फार्म तक सीधी टेम्पो डिलीवरी*
💵 *भुगतान विधि:* ${paymentText}

---------------------------------------
✅ *सिस्टम में ऑर्डर सुरक्षित दर्ज है।*
👉 *कृपया भाव की पुष्टि और गाड़ी रवानगी के लिए व्हाट्सएप पर 'SEND' दबाएं!*
(राधे कृष्णा पशु आहार • कृष्णा एग्रोवेट)`;
  }

  // English version
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentText = order.payment_method === 'cash_on_delivery'
    ? 'Cash on Delivery (COD)'
    : order.payment_method;

  return `🌾 *NEW CATTLE FEED ORDER* 🌾
*${businessName.toUpperCase()} (KRISHNA AGROVET)*

📋 *Order ID:* ${order.order_number}
📅 *Date & Time:* ${formattedDate}

👤 *Customer / Farmer Details:*
• Name: *${order.customer_name}*
• Mobile: *${order.customer_phone}*
• Village / Town: *${order.village_town}*
• Landmark: ${order.landmark || 'Not specified'}
• Full Address: ${order.full_address}
• PIN Code: ${order.pincode}
• District & State: ${order.district}, ${order.state}
${order.delivery_notes ? `• Delivery Instructions: _"${order.delivery_notes}"_\n` : ''}
📦 *Ordered Feed Bags:*
${itemsText}

📊 *Order Summary:*
• Total Sacks: *${order.total_bags} Bags* (${order.total_bags * 50} kg approx)
• Price / Rate: *Rate on WhatsApp*
• Farm Delivery: *Doorstep Farm Delivery*
💵 *Payment Method:* ${paymentText}

---------------------------------------
✅ *Order successfully registered in the system.*
👉 *Please press SEND to confirm your rate and schedule tempo dispatch with Krishna Agrovet!*`;
}

/**
 * Builds the wa.me click-to-chat URL with the formatted order message in selected language
 */
export function createWhatsAppOrderUrl(
  order: Order,
  ownerWhatsAppNumber: string,
  businessName?: string,
  lang: 'hi' | 'en' = 'hi'
): string {
  const cleanNumber = normalizeWhatsAppNumber(ownerWhatsAppNumber);
  const message = formatOrderWhatsAppMessage(order, businessName, lang);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}
