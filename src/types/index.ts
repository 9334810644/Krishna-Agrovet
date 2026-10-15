// ==============================================================================
// KRISHNA AGROVET DOMAIN TYPES
// ==============================================================================

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'packed' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type InventoryMovementReason = 
  | 'order_placed' 
  | 'order_cancelled' 
  | 'manual_adjustment' 
  | 'restock' 
  | 'spoilage_damage' 
  | 'correction';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  brand: string;
  sku: string;
  bag_weight_kg: number;
  price: number;
  mrp?: number;
  available_stock: number;
  low_stock_threshold: number;
  description: string;
  short_description?: string;
  image_url: string;
  is_active: boolean;
  featured: boolean;
  nutritional_info?: {
    crude_protein?: string;
    bypass_protein?: string;
    crude_fat?: string;
    crude_fiber?: string;
    calcium?: string;
    phosphorus?: string;
    moisture?: string;
    energy?: string;
    vitamin_ad3e?: string;
    [key: string]: string | undefined;
  };
  feeding_guide?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  brand: string;
  bag_weight_kg: number;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  village_town: string;
  full_address: string;
  landmark?: string;
  pincode: string;
  district: string;
  state: string;
  delivery_notes?: string;
  landmark_photo_url?: string;
  total_bags: number;
  subtotal_amount: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  status: OrderStatus;
  whatsapp_sent_at?: string;
  internal_notes?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  change_quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: InventoryMovementReason;
  order_id?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
}

export interface StoreSettings {
  id?: string;
  business_name: string;
  tagline: string;
  owner_whatsapp: string;
  owner_phone: string;
  support_email: string;
  delivery_areas: string;
  min_order_bags: number;
  delivery_fee_per_bag: number;
  free_delivery_threshold_bags: number;
  notice_banner_text: string;
  is_store_open: boolean;
  logo_url?: string;
  hero_banner_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'staff';
}

export interface CheckoutCustomerData {
  customer_name: string;
  customer_phone: string;
  village_town: string;
  full_address: string;
  landmark?: string;
  pincode: string;
  district?: string;
  state?: string;
  delivery_notes?: string;
  landmark_photo_url?: string;
  payment_method: string;
}

export interface AtomicOrderResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  total_bags?: number;
  subtotal_amount?: number;
  delivery_fee?: number;
  total_amount?: number;
  status?: string;
  message?: string;
}
