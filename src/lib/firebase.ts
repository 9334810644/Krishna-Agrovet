import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, 
  updateDoc, deleteDoc, query, where, orderBy, limit, runTransaction,
  onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  Product, Category, Order, StoreSettings, InventoryMovement, 
  CheckoutCustomerData, AtomicOrderResult, OrderStatus, InventoryMovementReason 
} from '../types';
import { LocalStoreManager, generateMockOrderNumber } from './mockStore';

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const getFirebaseConfig = (): FirebaseConnectionConfig => {
  let customConfig: Partial<FirebaseConnectionConfig> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kav_firebase_config');
      if (stored) {
        customConfig = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  return {
    apiKey: (customConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (customConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (customConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (customConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (customConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (customConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    measurementId: (customConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
  };
};

export const isFirebaseConfigured = (): boolean => {
  const cfg = getFirebaseConfig();
  return (
    typeof cfg.apiKey === 'string' &&
    cfg.apiKey.length > 5 &&
    typeof cfg.projectId === 'string' &&
    cfg.projectId.length > 2 &&
    !cfg.projectId.includes('your-project-id')
  );
};

export const getFirebaseConnectionDetails = () => {
  const cfg = getFirebaseConfig();
  const configured = isFirebaseConfigured();
  const isCustom = typeof window !== 'undefined' && !!localStorage.getItem('kav_firebase_config');
  return {
    isConfigured: configured,
    projectId: cfg.projectId || null,
    source: isCustom ? ('custom' as const) : configured ? ('env' as const) : ('none' as const),
    config: cfg
  };
};

export const saveCustomFirebaseConfig = (config: Partial<FirebaseConnectionConfig>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kav_firebase_config', JSON.stringify(config));
    window.location.reload();
  }
};

export const clearCustomFirebaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kav_firebase_config');
    window.location.reload();
  }
};

// Initialize Firebase App
const currentConfig = getFirebaseConfig();
export const app = isFirebaseConfigured()
  ? (getApps().length === 0 ? initializeApp(currentConfig) : getApp())
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

// Safe client-side analytics initialization
if (app && typeof window !== 'undefined' && currentConfig.measurementId) {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    }).catch(() => {});
  }).catch(() => {});
}

// ==============================================================================
// UNIFIED DATA SERVICE (Cloud Firestore + Reactive Real-Time & Fallback)
// ==============================================================================

export const dataService = {
  // PRODUCTS - REAL-TIME SUBSCRIPTION
  subscribeProducts(callback: (products: Product[]) => void, onError?: (err: any) => void): Unsubscribe {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'products'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            if (snapshot.empty) {
              // Auto-seed Firestore from local catalog if cloud database is empty
              try {
                const initial = LocalStoreManager.getProducts();
                for (const prod of initial) {
                  await setDoc(doc(db, 'products', prod.id), {
                    ...prod,
                    created_at: prod.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }, { merge: true });
                }
              } catch (seedErr) {
                console.error('Error auto-seeding products to Firestore:', seedErr);
              }
              return;
            }

            const list: Product[] = [];
            snapshot.forEach((d) => {
              list.push({ id: d.id, ...d.data() } as Product);
            });
            callback(list);
          },
          (err) => {
            console.error('Firestore products onSnapshot error:', err);
            onError?.(err);
            // Fallback to local on error so UI never breaks
            callback(LocalStoreManager.getProducts());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.error('Error initiating products subscription:', err);
        onError?.(err);
      }
    }

    // Local / Offline fallback with cross-tab and storage events
    callback(LocalStoreManager.getProducts());
    const handler = () => {
      callback(LocalStoreManager.getProducts());
    };
    window.addEventListener('kav_products_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('kav_products_changed', handler);
      window.removeEventListener('storage', handler);
    };
  },

  async getProducts(): Promise<Product[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'products'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach(d => {
            list.push({ id: d.id, ...d.data() } as Product);
          });
          return list;
        }
      } catch (err) {
        console.error('Firestore getProducts error:', err);
      }
    }
    return LocalStoreManager.getProducts();
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'products', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Product;
        }
      } catch (err) {
        console.error('Firestore getProductById error:', err);
      }
    }
    return LocalStoreManager.getProductById(id) || null;
  },

  async saveProduct(product: Partial<Product> & { name: string; brand: string; price?: number }): Promise<Product> {
    if (isFirebaseConfigured() && db) {
      const prodId = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, 'products', prodId);
      
      const payload: any = {
        name: product.name,
        brand: product.brand,
        sku: product.sku || `KAV-${Date.now().toString().slice(-6)}`,
        category_id: product.category_id || 'cat-1',
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
        ingredients: product.ingredients || [],
        packaging_info: product.packaging_info || undefined,
        updated_at: new Date().toISOString(),
      };

      if (!product.id) {
        payload.created_at = new Date().toISOString();
      }

      await setDoc(docRef, payload, { merge: true });
      LocalStoreManager.saveProduct({ ...payload, id: prodId });
      return { id: prodId, ...payload } as Product;
    }
    return LocalStoreManager.saveProduct(product);
  },

  async toggleProductActive(id: string): Promise<Product> {
    if (isFirebaseConfigured() && db) {
      const prod = await this.getProductById(id);
      if (!prod) throw new Error('Product not found');
      const docRef = doc(db, 'products', id);
      const newActive = !prod.is_active;
      await updateDoc(docRef, {
        is_active: newActive,
        updated_at: new Date().toISOString(),
      });
      const updated = { ...prod, is_active: newActive };
      LocalStoreManager.saveProduct(updated);
      return updated;
    }
    return LocalStoreManager.toggleProductActive(id);
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'products', id);
        await deleteDoc(docRef);
        LocalStoreManager.deleteProduct(id);
        return true;
      } catch (err) {
        console.error('Firestore deleteProduct error:', err);
        throw err;
      }
    }
    return LocalStoreManager.deleteProduct(id);
  },

  // CATEGORIES - REAL-TIME SUBSCRIPTION
  subscribeCategories(callback: (categories: Category[]) => void, onError?: (err: any) => void): Unsubscribe {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'categories'), orderBy('display_order', 'asc'));
        const unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            if (snapshot.empty) {
              try {
                const initial = LocalStoreManager.getCategories();
                for (const cat of initial) {
                  await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
                }
              } catch (seedErr) {
                console.error('Error auto-seeding categories to Firestore:', seedErr);
              }
              return;
            }

            const list: Category[] = [];
            snapshot.forEach((d) => {
              list.push({ id: d.id, ...d.data() } as Category);
            });
            callback(list);
          },
          (err) => {
            console.error('Firestore categories onSnapshot error:', err);
            onError?.(err);
            callback(LocalStoreManager.getCategories());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.error('Error subscribing to categories:', err);
        onError?.(err);
      }
    }

    callback(LocalStoreManager.getCategories());
    const handler = () => {
      callback(LocalStoreManager.getCategories());
    };
    window.addEventListener('kav_categories_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('kav_categories_changed', handler);
      window.removeEventListener('storage', handler);
    };
  },

  async getCategories(): Promise<Category[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'categories'), orderBy('display_order', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: Category[] = [];
          snap.forEach(d => {
            list.push({ id: d.id, ...d.data() } as Category);
          });
          return list;
        }
      } catch (err) {
        console.error('Firestore getCategories error:', err);
      }
    }
    return LocalStoreManager.getCategories();
  },

  // STORE SETTINGS - REAL-TIME SUBSCRIPTION
  subscribeSettings(callback: (settings: StoreSettings) => void, onError?: (err: any) => void): Unsubscribe {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'store_settings', 'default');
        const unsubscribe = onSnapshot(
          docRef,
          async (snapshot) => {
            if (!snapshot.exists()) {
              try {
                const initial = LocalStoreManager.getSettings();
                await setDoc(docRef, initial, { merge: true });
              } catch (seedErr) {
                console.error('Error auto-seeding settings to Firestore:', seedErr);
              }
              return;
            }

            const data = snapshot.data() as StoreSettings;
            if (!data.logo_url) {
              data.logo_url = '/images/krishna-agrovet-logo.png';
            }
            if (!data.hero_banners || data.hero_banners.length === 0) {
              data.hero_banners = [data.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg'];
            }
            callback(data);
          },
          (err) => {
            console.error('Firestore settings onSnapshot error:', err);
            onError?.(err);
            callback(LocalStoreManager.getSettings());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.error('Error subscribing to settings:', err);
        onError?.(err);
      }
    }

    callback(LocalStoreManager.getSettings());
    const handler = () => {
      callback(LocalStoreManager.getSettings());
    };
    window.addEventListener('kav_settings_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('kav_settings_changed', handler);
      window.removeEventListener('storage', handler);
    };
  },

  async getSettings(): Promise<StoreSettings> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'store_settings', 'default');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as StoreSettings;
          if (!data.logo_url) {
            data.logo_url = '/images/krishna-agrovet-logo.png';
          }
          if (!data.hero_banners || data.hero_banners.length === 0) {
            data.hero_banners = [data.hero_banner_url || '/images/banners/radhe-krishna-banner.jpg'];
          }
          return data;
        }
      } catch (err) {
        console.error('Firestore getSettings error:', err);
      }
    }
    return LocalStoreManager.getSettings();
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, 'store_settings', 'default');
      const current = await this.getSettings();
      const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
      await setDoc(docRef, updated, { merge: true });
      LocalStoreManager.updateSettings(settings);
      return updated;
    }
    return LocalStoreManager.updateSettings(settings);
  },

  // INVENTORY ADJUSTMENT & AUDIT LOGS
  async adjustInventory(
    productId: string,
    changeQuantity: number,
    reason: InventoryMovementReason,
    notes?: string
  ): Promise<Product> {
    if (isFirebaseConfigured() && db) {
      return await runTransaction(db, async (transaction) => {
        const pRef = doc(db, 'products', productId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) throw new Error('Product not found in Firestore');

        const currentStock = pSnap.data().available_stock || 0;
        const newStock = currentStock + changeQuantity;
        if (newStock < 0) {
          throw new Error(`Cannot adjust stock below 0. Current: ${currentStock}, Change: ${changeQuantity}`);
        }

        transaction.update(pRef, {
          available_stock: newStock,
          updated_at: new Date().toISOString(),
        });

        const movRef = doc(collection(db, 'inventory_movements'));
        transaction.set(movRef, {
          product_id: productId,
          product_name: pSnap.data().name || 'Product',
          change_quantity: changeQuantity,
          previous_stock: currentStock,
          new_stock: newStock,
          reason,
          notes: notes || null,
          created_at: new Date().toISOString(),
        });

        const updated = { id: pSnap.id, ...pSnap.data(), available_stock: newStock } as Product;
        LocalStoreManager.saveProduct(updated);
        return updated;
      });
    }

    return LocalStoreManager.adjustInventory(productId, changeQuantity, reason, notes);
  },

  subscribeInventoryMovements(callback: (movements: InventoryMovement[]) => void): Unsubscribe {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'inventory_movements'), orderBy('created_at', 'desc'), limit(100));
        return onSnapshot(q, (snap) => {
          const list: InventoryMovement[] = [];
          snap.forEach(d => {
            list.push({ id: d.id, ...d.data() } as InventoryMovement);
          });
          callback(list);
        }, (err) => {
          console.error('Inventory movements onSnapshot error:', err);
          callback(LocalStoreManager.getInventoryMovements());
        });
      } catch (err) {
        console.error('Error subscribing to inventory movements:', err);
      }
    }

    callback(LocalStoreManager.getInventoryMovements());
    const handler = () => {
      callback(LocalStoreManager.getInventoryMovements());
    };
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'inventory_movements'), orderBy('created_at', 'desc'), limit(100));
        const snap = await getDocs(q);
        const list: InventoryMovement[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as InventoryMovement);
        });
        return list;
      } catch (err) {
        console.error('Firestore getInventoryMovements error:', err);
      }
    }
    return LocalStoreManager.getInventoryMovements();
  },

  // ORDERS
  async placeOrderAtomic(
    customerData: CheckoutCustomerData,
    items: { product_id: string; quantity: number }[],
    idempotencyKey?: string
  ): Promise<AtomicOrderResult> {
    if (isFirebaseConfigured() && db) {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const products: Product[] = [];
        productsSnap.forEach(d => products.push({ id: d.id, ...d.data() } as Product));

        const settingsSnap = await getDoc(doc(db, 'store_settings', 'default'));
        const settings: StoreSettings = settingsSnap.exists()
          ? (settingsSnap.data() as StoreSettings)
          : LocalStoreManager.getSettings();

        // Idempotency check
        if (idempotencyKey) {
          const qIdemp = query(collection(db, 'orders'), where('idempotency_key', '==', idempotencyKey), limit(1));
          const idempSnap = await getDocs(qIdemp);
          if (!idempSnap.empty) {
            const existing = idempSnap.docs[0].data() as Order;
            return {
              success: true,
              order_id: idempSnap.docs[0].id,
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

        let totalBags = 0;
        let subtotalAmount = 0;
        const orderItems: any[] = [];

        for (const item of items) {
          const prod = products.find(p => p.id === item.product_id);
          if (!prod) throw new Error(`Product not found: ${item.product_id}`);
          if (!prod.is_active) throw new Error(`Product "${prod.name}" is discontinued.`);
          if (prod.available_stock < item.quantity) {
            throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.available_stock} bags, Requested: ${item.quantity} bags.`);
          }
          totalBags += item.quantity;
          subtotalAmount += prod.price * item.quantity;
          orderItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            order_id: '',
            product_id: prod.id,
            product_name: prod.name,
            product_code: prod.sku || '',
            category_name: prod.category_id,
            bag_weight_kg: prod.bag_weight_kg || 50,
            quantity: item.quantity,
            price_per_bag: prod.price,
            total_price: prod.price * item.quantity,
          });
        }

        const deliveryFee = totalBags < settings.free_delivery_threshold_bags
          ? totalBags * settings.delivery_fee_per_bag
          : 0;
        const totalAmount = subtotalAmount + deliveryFee;
        const newOrderId = `ord-${Date.now()}`;
        const newOrderNumber = generateMockOrderNumber();

        orderItems.forEach(it => { it.order_id = newOrderId; });

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

        await setDoc(doc(db, 'orders', newOrderId), newOrder);

        // Deduct inventory in Firestore
        for (const item of items) {
          const prod = products.find(p => p.id === item.product_id)!;
          const newStock = Math.max(0, prod.available_stock - item.quantity);
          await updateDoc(doc(db, 'products', prod.id), {
            available_stock: newStock,
            updated_at: new Date().toISOString(),
          });

          const movId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await setDoc(doc(db, 'inventory_movements', movId), {
            id: movId,
            product_id: prod.id,
            product_name: prod.name,
            change_quantity: -item.quantity,
            previous_stock: prod.available_stock,
            new_stock: newStock,
            reason: 'order_sale',
            order_id: newOrderId,
            notes: `Reserved for order ${newOrderNumber}`,
            created_at: new Date().toISOString(),
          });
        }

        LocalStoreManager.placeOrderAtomic(customerData, items, idempotencyKey);

        return {
          success: true,
          order_id: newOrderId,
          order_number: newOrderNumber,
          total_bags: totalBags,
          subtotal_amount: subtotalAmount,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          status: 'pending',
          message: 'Order created and stock reserved successfully in Firestore.',
        };
      } catch (err) {
        console.error('Firestore placeOrderAtomic fallback:', err);
        return LocalStoreManager.placeOrderAtomic(customerData, items, idempotencyKey);
      }
    }

    return LocalStoreManager.placeOrderAtomic(customerData, items, idempotencyKey);
  },

  async getOrders(): Promise<Order[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100));
        const snap = await getDocs(q);
        const list: Order[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Order);
        });
        return list;
      } catch (err) {
        console.error('Firestore getOrders error:', err);
      }
    }
    return LocalStoreManager.getOrders();
  },

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'orders'), where('order_number', '==', orderNumber), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
        }
      } catch (err) {
        console.error('Firestore getOrderByNumber error:', err);
      }
    }
    return LocalStoreManager.getOrderByNumber(orderNumber);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    if (isFirebaseConfigured() && db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          const current = snap.data() as Order;
          const updateData: Partial<Order> = {
            status,
            updated_at: new Date().toISOString(),
          };
          if (notes) {
            updateData.internal_notes = `${current.internal_notes ? current.internal_notes + '\n' : ''}[${new Date().toLocaleDateString('en-IN')}] ${notes}`;
          }
          await updateDoc(orderRef, updateData);
          LocalStoreManager.updateOrderStatus(orderId, status, notes);
          return { ...current, ...updateData };
        }
      } catch (err) {
        console.error('Firestore updateOrderStatus error:', err);
      }
    }
    return LocalStoreManager.updateOrderStatus(orderId, status, notes);
  },

  // ONE-CLICK SYNC ALL DATA TO CLOUD FIRESTORE
  async syncAllToFirestore(): Promise<{ productsCount: number; categoriesCount: number; settingsSynced: boolean }> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not yet configured with valid Project ID and API Key.');
    }

    const currentProds = LocalStoreManager.getProducts();
    const currentCats = LocalStoreManager.getCategories();
    const currentSettings = LocalStoreManager.getSettings();

    // 1. Sync Settings
    await setDoc(doc(db, 'store_settings', 'default'), {
      ...currentSettings,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    // 2. Sync Categories
    for (const cat of currentCats) {
      await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
    }

    // 3. Sync Products
    for (const prod of currentProds) {
      await setDoc(doc(db, 'products', prod.id), {
        ...prod,
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }

    return {
      productsCount: currentProds.length,
      categoriesCount: currentCats.length,
      settingsSynced: true,
    };
  },

  // TEST FIRESTORE CONNECTION
  async testFirestoreConnection(): Promise<{ success: boolean; message: string; projectId: string | null }> {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        message: 'Firebase configuration is incomplete. Please provide API Key and Project ID.',
        projectId: null,
      };
    }

    try {
      // Test read/write to _ping doc
      const pingDoc = doc(db, '_connection_test', 'status');
      await setDoc(pingDoc, {
        timestamp: new Date().toISOString(),
        client: 'Krishna Agrovet Web App',
      }, { merge: true });

      const snap = await getDoc(pingDoc);
      if (snap.exists()) {
        const cfg = getFirebaseConfig();
        return {
          success: true,
          message: `Successfully connected to Cloud Firestore (Project: ${cfg.projectId})! Real-time streaming is active.`,
          projectId: cfg.projectId,
        };
      }
      throw new Error('Could not read test document back from Firestore.');
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to connect to Cloud Firestore. Check security rules or project permissions.',
        projectId: getFirebaseConfig().projectId || null,
      };
    }
  }
};
