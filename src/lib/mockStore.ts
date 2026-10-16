import { 
  Product, Category, Order, StoreSettings, InventoryMovement, 
  CheckoutCustomerData, AtomicOrderResult, OrderStatus, InventoryMovementReason 
} from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, INITIAL_STORE_SETTINGS, MOCK_INITIAL_ORDERS } from './mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'kav_products',
  CATEGORIES: 'kav_categories',
  ORDERS: 'kav_orders',
  SETTINGS: 'kav_settings',
  INVENTORY_MOVEMENTS: 'kav_inventory_movements',
  DELETED_PRODUCT_IDS: 'kav_deleted_product_ids',
};

// Automatic versioned storage purge to ensure mobile devices load latest catalog
const CURRENT_CACHE_VERSION = 'v5_rkpa_authentic_catalog';
if (typeof window !== 'undefined') {
  try {
    const cachedVer = localStorage.getItem('kav_cache_version');
    if (cachedVer !== CURRENT_CACHE_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.DELETED_PRODUCT_IDS);
      localStorage.setItem('kav_cache_version', CURRENT_CACHE_VERSION);
    }
  } catch {
    // ignore
  }
}

// Helper for local storage
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

function broadcastProductsChanged(action: string, data?: any): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('kav_products_changed', { detail: { action, data } }));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  }
}

// Generate unique order number: KAV-YYYYMMDD-XXXX
export function generateMockOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `KAV-${dateStr}-${randomSuffix}`;
}

export class LocalStoreManager {
  // Products
  static getProducts(): Product[] {
    const deletedIds = getStorageItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []);
    const rawList = getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    
    // Purge any products that were deleted or any unwanted legacy random feeds
    const UNWANTED_PRODUCT_IDS = new Set([
      'prod-kapila-hipro',
      'prod-3',
      'prod-4',
      'prod-5',
      'prod-6',
      'prod-7',
      'prod-8',
    ]);
    const list = rawList.filter(p => !deletedIds.includes(p.id) && !UNWANTED_PRODUCT_IDS.has(p.id));
    let changed = list.length !== rawList.length;

    const existingMap = new Map<string, Product>();
    list.forEach(p => existingMap.set(p.id, p));

    for (const mockP of MOCK_PRODUCTS) {
      // NEVER restore any product that the user has explicitly deleted!
      if (deletedIds.includes(mockP.id) || UNWANTED_PRODUCT_IDS.has(mockP.id)) {
        continue;
      }

      if (!existingMap.has(mockP.id)) {
        list.push(mockP);
        changed = true;
      } else {
        const item = existingMap.get(mockP.id)!;
        if (!item.features && mockP.features) {
          item.features = mockP.features;
          changed = true;
        }
        if (!item.ingredients && mockP.ingredients) {
          item.ingredients = mockP.ingredients;
          changed = true;
        }
        if (!item.packaging_info && mockP.packaging_info) {
          item.packaging_info = mockP.packaging_info;
          changed = true;
        }
        if (item.packaging_info && /50\s*kg/i.test(item.packaging_info)) {
          item.packaging_info = 'सुरक्षित सीलबंद बोरियां (Sealed Feed Bags)';
          changed = true;
        }
        if (item.short_description && /50\s*kg/i.test(item.short_description)) {
          item.short_description = item.short_description.replace(/50\s*kg\s*/gi, '').trim();
          changed = true;
        }
        if (item.features) {
          const newFeat = item.features.map(f => f.replace(/50\s*kg\s*/gi, ''));
          if (JSON.stringify(newFeat) !== JSON.stringify(item.features)) {
            item.features = newFeat;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setStorageItem(STORAGE_KEYS.PRODUCTS, list);
    }
    return list;
  }

  static getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  }

  static saveProduct(product: Partial<Product> & { name: string; brand: string; price?: number }): Product {
    const products = this.getProducts();
    let savedProduct: Product;

    if (product.id) {
      // If updating/re-creating, remove from deleted IDs
      const deletedIds = getStorageItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []);
      if (deletedIds.includes(product.id)) {
        setStorageItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, deletedIds.filter(d => d !== product.id));
      }

      // Update
      const index = products.findIndex(p => p.id === product.id);
      if (index === -1) throw new Error('Product not found');
      savedProduct = {
        ...products[index],
        ...product,
        updated_at: new Date().toISOString(),
      };
      products[index] = savedProduct;
    } else {
      // Create
      savedProduct = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        category_id: product.category_id || 'cat-1',
        name: product.name,
        brand: product.brand,
        sku: product.sku || `KAV-${Date.now().toString().slice(-6)}`,
        bag_weight_kg: Number(product.bag_weight_kg) || 50,
        price: Number(product.price || 0),
        mrp: product.mrp ? Number(product.mrp) : undefined,
        available_stock: Number(product.available_stock) || 0,
        low_stock_threshold: Number(product.low_stock_threshold) || 10,
        description: product.description || '',
        short_description: product.short_description || '',
        image_url: product.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
        is_active: product.is_active !== undefined ? product.is_active : true,
        featured: !!product.featured,
        nutritional_info: product.nutritional_info || {},
        feeding_guide: product.feeding_guide || '',
        features: product.features || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      products.push(savedProduct);

      // Audit initial stock
      if (savedProduct.available_stock > 0) {
        this.logInventoryMovement(
          savedProduct.id,
          savedProduct.name,
          savedProduct.available_stock,
          0,
          savedProduct.available_stock,
          'restock',
          undefined,
          'Initial stock on product creation'
        );
      }
    }

    setStorageItem(STORAGE_KEYS.PRODUCTS, products);
    broadcastProductsChanged('save', savedProduct);
    return savedProduct;
  }

  static toggleProductActive(id: string): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index].is_active = !products[index].is_active;
    products[index].updated_at = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.PRODUCTS, products);
    broadcastProductsChanged('toggle', products[index]);
    return products[index];
  }

  static deleteProduct(id: string): boolean {
    // Record in deleted IDs so mock products never resurrect
    const deletedIds = getStorageItem<string[]>(STORAGE_KEYS.DELETED_PRODUCT_IDS, []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      setStorageItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, deletedIds);
    }

    const products = getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const updated = products.filter(p => p.id !== id);
    setStorageItem(STORAGE_KEYS.PRODUCTS, updated);

    broadcastProductsChanged('delete', { id });
    return true;
  }

  // Categories
  static getCategories(): Category[] {
    const raw = getStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const UNWANTED_CAT_IDS = new Set(['cat-3', 'cat-4', 'cat-5']);
    const list = raw.filter(c => !UNWANTED_CAT_IDS.has(c.id));
    if (list.length !== raw.length) {
      setStorageItem(STORAGE_KEYS.CATEGORIES, list);
    }
    return list;
  }

  // Store Settings
  static getSettings(): StoreSettings {
    const settings = getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
    let changed = false;
    if (!settings.logo_url) {
      settings.logo_url = '/images/krishna-agrovet-logo.png';
      changed = true;
    }
    if (!settings.hero_banner_url) {
      settings.hero_banner_url = '/images/banners/radhe-krishna-banner.jpg';
      changed = true;
    }
    if (!settings.hero_banners || settings.hero_banners.length === 0) {
      settings.hero_banners = [settings.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg'];
      changed = true;
    }
    if (settings.owner_whatsapp === '919876543210' || !settings.owner_whatsapp || settings.owner_whatsapp.includes('98765')) {
      settings.owner_whatsapp = '919470847471';
      settings.owner_phone = '+91 94708 47471';
      changed = true;
    }
    if (settings.support_email !== 'krishnaagrovet@gmail.com') {
      settings.support_email = 'krishnaagrovet@gmail.com';
      changed = true;
    }
    if (!settings.office_address) {
      settings.office_address = 'Khasra No. 354/ 1, Patanwa, Industrial area, Ramnagar, Chandauli, ( U. P )';
      changed = true;
    }
    if (changed) {
      setStorageItem(STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  }

  static updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    setStorageItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // Orders
  static getOrders(): Order[] {
    return getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, MOCK_INITIAL_ORDERS);
  }

  static getOrderById(id: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find(o => o.id === id);
  }

  static getOrderByNumber(orderNumber: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find(o => o.order_number.toUpperCase() === orderNumber.toUpperCase().trim());
  }

  // Atomic Order Placement Simulation
  static placeOrderAtomic(
    customerData: CheckoutCustomerData,
    items: { product_id: string; quantity: number }[],
    idempotencyKey?: string
  ): AtomicOrderResult {
    const orders = this.getOrders();

    // Idempotency check
    if (idempotencyKey) {
      const existing = orders.find(o => o.idempotency_key === idempotencyKey);
      if (existing) {
        return {
          success: true,
          order_id: existing.id,
          order_number: existing.order_number,
          total_bags: existing.total_bags,
          subtotal_amount: existing.subtotal_amount,
          delivery_fee: existing.delivery_fee,
          total_amount: existing.total_amount,
          status: existing.status,
          message: 'Existing order returned via idempotency key.',
        };
      }
    }

    if (!items || items.length === 0) {
      throw new Error('Order items cannot be empty.');
    }

    const products = this.getProducts();
    const settings = this.getSettings();
    let totalBags = 0;
    let subtotalAmount = 0;

    // Validate stock and verify products
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      if (!prod.is_active) {
        throw new Error(`Product "${prod.name}" is currently discontinued or out of catalog.`);
      }
      if (prod.available_stock < item.quantity) {
        throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.available_stock} bags, Requested: ${item.quantity} bags.`);
      }
      totalBags += item.quantity;
      subtotalAmount += prod.price * item.quantity;
    }

    // Delivery fee calculation
    const deliveryFee = totalBags < settings.free_delivery_threshold_bags 
      ? totalBags * settings.delivery_fee_per_bag 
      : 0;
    const totalAmount = subtotalAmount + deliveryFee;

    const newOrderId = `ord-${Date.now()}`;
    const newOrderNumber = generateMockOrderNumber();

    // Deduct stock and build immutable items snapshot
    const orderItems = items.map(item => {
      const prod = products.find(p => p.id === item.product_id)!;
      const prevStock = prod.available_stock;
      prod.available_stock -= item.quantity;
      prod.updated_at = new Date().toISOString();

      // Log inventory movement
      this.logInventoryMovement(
        prod.id,
        prod.name,
        -item.quantity,
        prevStock,
        prod.available_stock,
        'order_placed',
        newOrderId,
        `Customer order ${newOrderNumber}`
      );

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        order_id: newOrderId,
        product_id: prod.id,
        product_name: prod.name,
        brand: prod.brand,
        bag_weight_kg: prod.bag_weight_kg,
        unit_price: prod.price,
        quantity: item.quantity,
        line_total: prod.price * item.quantity,
      };
    });

    // Save updated products
    setStorageItem(STORAGE_KEYS.PRODUCTS, products);

    // Save order
    const newOrder: Order = {
      id: newOrderId,
      order_number: newOrderNumber,
      customer_name: customerData.customer_name.trim(),
      customer_phone: customerData.customer_phone.trim(),
      village_town: customerData.village_town.trim(),
      full_address: customerData.full_address.trim(),
      landmark: customerData.landmark?.trim(),
      pincode: customerData.pincode.trim(),
      district: customerData.district || 'Alwar',
      state: customerData.state || 'Rajasthan',
      delivery_notes: customerData.delivery_notes?.trim(),
      landmark_photo_url: customerData.landmark_photo_url || '',
      total_bags: totalBags,
      subtotal_amount: subtotalAmount,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      payment_method: customerData.payment_method || 'cash_on_delivery',
      status: 'pending',
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
    };

    orders.unshift(newOrder);
    setStorageItem(STORAGE_KEYS.ORDERS, orders);

    return {
      success: true,
      order_id: newOrderId,
      order_number: newOrderNumber,
      total_bags: totalBags,
      subtotal_amount: subtotalAmount,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      status: 'pending',
      message: 'Order created and stock reserved successfully.',
    };
  }

  // Atomic Order Cancellation with Stock Restoration
  static cancelOrderAtomic(orderId: string, reason: string = 'Owner or customer cancelled'): Order {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');

    const order = orders[orderIndex];
    if (order.status === 'cancelled') {
      return order; // Already cancelled, prevent double restore
    }

    // Restore stock
    const products = this.getProducts();
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (!item.product_id) continue;
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const prevStock = prod.available_stock;
          prod.available_stock += item.quantity;
          prod.updated_at = new Date().toISOString();

          this.logInventoryMovement(
            prod.id,
            prod.name,
            item.quantity,
            prevStock,
            prod.available_stock,
            'order_cancelled',
            order.id,
            `Restored on cancellation: ${reason}`
          );
        }
      }
      setStorageItem(STORAGE_KEYS.PRODUCTS, products);
    }

    order.status = 'cancelled';
    order.internal_notes = `${order.internal_notes ? order.internal_notes + '\n' : ''}[Cancelled ${new Date().toLocaleDateString('en-IN')}] ${reason}`;
    order.updated_at = new Date().toISOString();

    orders[orderIndex] = order;
    setStorageItem(STORAGE_KEYS.ORDERS, orders);
    return order;
  }

  // Update Order Status
  static updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Order {
    if (status === 'cancelled') {
      return this.cancelOrderAtomic(orderId, notes || 'Status updated to cancelled');
    }

    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');

    const order = orders[orderIndex];
    order.status = status;
    if (notes) {
      order.internal_notes = `${order.internal_notes ? order.internal_notes + '\n' : ''}[${new Date().toLocaleDateString('en-IN')}] ${notes}`;
    }
    order.updated_at = new Date().toISOString();

    orders[orderIndex] = order;
    setStorageItem(STORAGE_KEYS.ORDERS, orders);
    return order;
  }

  // Adjust stock manually with mandatory reason and audit entry
  static adjustInventory(
    productId: string,
    changeQuantity: number,
    reason: InventoryMovementReason,
    notes?: string
  ): Product {
    if (changeQuantity === 0) throw new Error('Adjustment quantity cannot be 0');

    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const prevStock = prod.available_stock;
    const newStock = prevStock + changeQuantity;
    if (newStock < 0) {
      throw new Error(`Cannot adjust stock below 0. Current: ${prevStock}, Adjustment: ${changeQuantity}`);
    }

    prod.available_stock = newStock;
    prod.updated_at = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.PRODUCTS, products);

    this.logInventoryMovement(
      prod.id,
      prod.name,
      changeQuantity,
      prevStock,
      newStock,
      reason,
      undefined,
      notes
    );

    return prod;
  }

  // Audit Logs
  static getInventoryMovements(): InventoryMovement[] {
    return getStorageItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  }

  private static logInventoryMovement(
    productId: string,
    productName: string,
    changeQuantity: number,
    previousStock: number,
    newStock: number,
    reason: InventoryMovementReason,
    orderId?: string,
    notes?: string
  ): void {
    const movements = this.getInventoryMovements();
    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product_id: productId,
      product_name: productName,
      change_quantity: changeQuantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: reason,
      order_id: orderId,
      notes: notes,
      created_at: new Date().toISOString(),
    };
    movements.unshift(movement);
    setStorageItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements.slice(0, 100)); // Keep latest 100
  }

  // Reset to demo defaults
  static resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY_MOVEMENTS);
  }
}
