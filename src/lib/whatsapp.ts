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
    .map((item) => {
      const cleanName = item.product.name.replace(/^Radhe\s+Krishna\s+/i, '').trim() || item.product.name;
      const weight = item.product.bag_weight_kg || 50;
      return `${cleanName} - ${item.quantity} bag (${weight}kg)`;
    })
    .join('\n');

  if (isHindi) {
    const message = `*${businessName} - ऑर्डर पूछताछ*

${itemsText}

*कुल:* ${totalBags} बैग (${totalWeightKg.toLocaleString('en-IN')} किग्रा)
कृपया आज का भाव व डिलीवरी का समय बताएं।`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  // English version
  const message = `*${businessName} - Order Inquiry*

${itemsText}

*Total:* ${totalBags} bags (${totalWeightKg.toLocaleString('en-IN')} kg)
Please share today's rate & delivery schedule.`;

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
    .map((item) => {
      const cleanName = item.product_name.replace(/^Radhe\s+Krishna\s+/i, '').trim() || item.product_name;
      const weight = item.bag_weight_kg || 50;
      return `${cleanName} - ${item.quantity} bag (${weight}kg)`;
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

    return `*${businessName} - नया ऑर्डर*

📋 *ऑर्डर संख्या:* #${order.order_number}
📅 *दिनांक:* ${formattedDate}

${itemsText}

*कुल बोरियां:* ${order.total_bags} बैग (${order.total_bags * 50} किग्रा)
👤 *किसान:* ${order.customer_name} (${order.customer_phone})
📍 *पता:* ${order.full_address || order.village_town || ''}
${order.delivery_notes ? `📝 *निर्देश:* ${order.delivery_notes}\n` : ''}
कृपया गाड़ी डिस्पैच व आज का भाव कन्फर्म करें।`;
  }

  // English version
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `*${businessName} - New Order*

📋 *Order ID:* #${order.order_number}
📅 *Date:* ${formattedDate}

${itemsText}

*Total Bags:* ${order.total_bags} bags (${order.total_bags * 50} kg)
👤 *Customer:* ${order.customer_name} (${order.customer_phone})
📍 *Address:* ${order.full_address || order.village_town || ''}
${order.delivery_notes ? `📝 *Notes:* ${order.delivery_notes}\n` : ''}
Please confirm tempo dispatch and today's rate.`;
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
