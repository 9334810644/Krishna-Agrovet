import { Order, Product } from '../types';

/**
 * Normalizes phone number into international digits-only format for WhatsApp wa.me link.
 * Example: "+91 98765 43210" or "09876543210" -> "919876543210"
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '919876543210';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean;
}

/**
 * Builds the direct WhatsApp inquiry URL from Cart items with pre-filled message
 */
export function createCartWhatsAppUrl(
  items: { product: Product; quantity: number }[],
  ownerWhatsAppNumber: string,
  businessName: string = 'Radhe Krishna Pashu Aahar'
): string {
  const cleanNumber = normalizeWhatsAppNumber(ownerWhatsAppNumber);
  const totalBags = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = items.reduce((sum, item) => sum + item.quantity * (item.product.bag_weight_kg || 50), 0);

  const itemsText = items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.product.name}*\n   ${item.product.bag_weight_kg || 50}kg Sack | Qty: *${item.quantity} Bags* (${item.quantity * (item.product.bag_weight_kg || 50)} kg)`
    )
    .join('\n');

  const message = `🌾 *पशु आहार पूछताछ / CATTLE FEED INQUIRY* 🌾
*${businessName.toUpperCase()} (KRISHNA AGROVET)*

नमस्ते, मैं अपनी डेयरी के लिए निम्नलिखित पशु आहार बोरियों के ऑर्डर और डिलीवरी के संबंध में चर्चा करना चाहता हूं:

📦 *चयनित उत्पाद (Selected Feed):*
${itemsText}

📊 *कुल बोरियां:* *${totalBags} Bags* (${totalWeightKg} kg)
💰 *कीमत / भाव:* व्हाट्सएप पर चर्चा (Rate on WhatsApp)
कृपया आज का डिस्काउंट भाव, टेम्पो डिलीवरी और डिस्पैच का समय बताएं।`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats a clean, readable, professional order message in English and Hindi context for the owner
 */
export function formatOrderWhatsAppMessage(order: Order, businessName: string = 'Radhe Krishna Pashu Aahar'): string {
  const itemsText = (order.items || [])
    .map(
      (item, index) =>
        `${index + 1}. *${item.product_name}*\n   ${item.bag_weight_kg || 50}kg Sack | Qty: *${item.quantity} Bags* (${item.quantity * (item.bag_weight_kg || 50)} kg)`
    )
    .join('\n');

  const message = `🌾 *नया पशु आहार ऑर्डर / NEW ORDER* 🌾
*${businessName.toUpperCase()} (KRISHNA AGROVET)*

📋 *Order ID:* ${order.order_number}
📅 *दिनांक:* ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

👤 *ग्राहक / किसान विवरण (Customer Details):*
• नाम (Name): *${order.customer_name}*
• मोबाइल (Mobile): *${order.customer_phone}*
• गांव / कस्बा (Village): *${order.village_town}*
• पहचान चिन्ह (Landmark): ${order.landmark || 'Not specified'}
• पूरा पता (Address): ${order.full_address}
• पिन कोड (PIN Code): ${order.pincode}
• जिला व राज्य: ${order.district}, ${order.state}
${order.delivery_notes ? `• डिलीवरी निर्देश: _"${order.delivery_notes}"_\n` : ''}
📦 *ऑर्डर की गई बोरियां (Items):*
${itemsText}

📊 *ऑर्डर विवरण (Summary):*
• कुल बोरियां (Total Sacks): *${order.total_bags} Bags* (${order.total_bags * 50} kg approx)
• कीमत / भाव: *व्हाट्सएप पर चर्चा / Rate on WhatsApp*
• फार्म डिलीवरी (Delivery): *${order.delivery_fee === 0 ? 'मुफ्त (FREE Doorstep Delivery)' : 'Doorstep Farm Delivery'}*
💵 *भुगतान विधि:* ${order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery (डिलीवरी पर नकद)' : order.payment_method}

---------------------------------------
✅ *सिस्टम में ऑर्डर सुरक्षित दर्ज है।*
👉 *किसान / ग्राहक: कृपया भाव की पुष्टि व गाड़ी रवानगी के लिए व्हाट्सएप पर 'SEND' दबाएं!*
(Please press SEND to confirm your rate & order dispatch with Krishna Agrovet!)`;

  return message;
}

/**
 * Builds the wa.me click-to-chat URL
 */
export function createWhatsAppOrderUrl(order: Order, ownerWhatsAppNumber: string, businessName?: string): string {
  const cleanNumber = normalizeWhatsAppNumber(ownerWhatsAppNumber);
  const message = formatOrderWhatsAppMessage(order, businessName);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}
