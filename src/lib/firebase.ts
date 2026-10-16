import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, 
  updateDoc, deleteDoc, query, where, orderBy, limit, runTransaction,
  onSnapshot, Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  Product, Category, Order, OrderItem, StoreSettings, InventoryMovement, 
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

// Built-in production Firebase credentials for Krishna Agrovet
// Guarantees reliable connection on both laptop and mobile, including Netlify deployments where .env is omitted
const DEFAULT_FIREBASE_CONFIG: FirebaseConnectionConfig = {
  apiKey: "AIzaSyBmt8QSPWs7deT3VgosM8f_NR3DBOtLxgw",
  authDomain: "krishna-agrovet.firebaseapp.com",
  projectId: "krishna-agrovet",
  storageBucket: "krishna-agrovet.firebasestorage.app",
  messagingSenderId: "730673305520",
  appId: "1:730673305520:web:a25e472dc196d90e34e875",
  measurementId: "G-JWQ62BTNV5",
};

export const getFirebaseConfig = (): FirebaseConnectionConfig => {
  let customConfig: Partial<FirebaseConnectionConfig> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kav_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only accept custom config if it has valid credentials
        if (parsed && typeof parsed.apiKey === 'string' && parsed.apiKey.length > 5 && parsed.projectId) {
          customConfig = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    apiKey: (customConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey).trim(),
    authDomain: (customConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain).trim(),
    projectId: (customConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId).trim(),
    storageBucket: (customConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket).trim(),
    messagingSenderId: (customConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId).trim(),
    appId: (customConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId).trim(),
    measurementId: (customConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId || '').trim(),
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

// Unwanted legacy dummy product IDs that should never be displayed
const UNWANTED_PRODUCT_IDS = new Set([
  'prod-kapila-hipro',
  'prod-3',
  'prod-4',
  'prod-5',
  'prod-6',
  'prod-7',
  'prod-8',
]);

/**
 * Recursively removes any object keys whose values are `undefined`,
 * which Firestore strictly rejects during setDoc / updateDoc operations.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = typeof val === 'object' && val !== null ? sanitizeFirestorePayload(val) : val;
    }
  }
  return cleaned as T;
}

/**
 * Normalizes raw Firestore document data to handle any schema variations:
 * - name vs title vs product_name
 * - is_active (defaults to true if omitted!)
 * - image_url vs image vs imageUrl
 * - stock vs available_stock
 */
export function normalizeProductDocument(id: string, data: any): Product {
  const is_active = data.is_active !== undefined
    ? Boolean(data.is_active)
    : data.isActive !== undefined
    ? Boolean(data.isActive)
    : true; // Crucial: default to active if omitted in Firestore console!

  const name = (data.name || data.title || data.product_name || 'Radhe Krishna Cattle Feed').trim();
  const brand = (data.brand || 'Radhe Krishna (Krishna Agrovet)').trim();
  const sku = (data.sku || data.product_code || `RKPA-${id.slice(-6)}`).trim();
  const category_id = (data.category_id || data.categoryId || 'cat-1').trim();
  const bag_weight_kg = Number(data.bag_weight_kg || data.bagWeight || data.weight || 50);
  const price = Number(data.price || data.rate || data.unit_price || 0);
  const mrp = data.mrp ? Number(data.mrp) : undefined;
  const available_stock = Number(
    data.available_stock !== undefined
      ? data.available_stock
      : data.stock !== undefined
      ? data.stock
      : 50
  );
  const low_stock_threshold = Number(data.low_stock_threshold || data.lowStockThreshold || 10);
  const description = (data.description || data.desc || '').trim();
  const short_description = (data.short_description || data.shortDescription || '').trim();
  
  let image_url = (data.image_url || data.image || data.imageUrl || data.photo_url || '').trim();
  if (!image_url || image_url.includes('undefined')) {
    image_url = name.toLowerCase().includes('ekstra')
      ? '/images/products/radhe-krishna-ekstrapro-50kg.svg'
      : '/images/products/radhe-krishna-bypass-50kg.svg';
  }

  return {
    id,
    name,
    brand,
    sku,
    category_id,
    bag_weight_kg,
    price,
    mrp,
    available_stock,
    low_stock_threshold,
    description,
    short_description,
    image_url,
    is_active,
    featured: Boolean(data.featured !== undefined ? data.featured : true),
    nutritional_info: data.nutritional_info || data.nutritionalInfo || {},
    feeding_guide: data.feeding_guide || data.feedingGuide || '',
    features: Array.isArray(data.features) ? data.features : [],
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    packaging_info: data.packaging_info || data.packagingInfo || undefined,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
}

// ==============================================================================
// UNIFIED DATA SERVICE (Cloud Firestore + Reactive Real-Time & Fallback)
// ==============================================================================

export const dataService = {
  // PRODUCTS - REAL-TIME SUBSCRIPTION
  subscribeProducts(callback: (products: Product[]) => void, onError?: (err: any) => void): Unsubscribe {
    // Deliver locally cached products synchronously at 0ms so products never disappear on reload!
    try {
      const cached = LocalStoreManager.getProducts();
      if (cached && cached.length > 0) {
        callback(cached);
      }
    } catch (err) {
      console.warn('Error retrieving cached products:', err);
    }

    if (isFirebaseConfigured() && db) {
      try {
        // Query products collection
        const unsubscribe = onSnapshot(
          collection(db, 'products'),
          async (snapshot) => {
            if (snapshot.empty) {
              // Also check 'Products' capitalized collection in case user created it capitalized in Firebase console
              try {
                const capSnap = await getDocs(collection(db, 'Products'));
                if (!capSnap.empty) {
                  const capList: Product[] = [];
                  capSnap.forEach(d => {
                    if (!UNWANTED_PRODUCT_IDS.has(d.id)) {
                      capList.push(normalizeProductDocument(d.id, d.data()));
                    }
                  });
                  if (capList.length > 0) {
                    capList.sort((a, b) => {
                      if (a.featured && !b.featured) return -1;
                      if (!a.featured && b.featured) return 1;
                      return (a.name || '').localeCompare(b.name || '');
                    });
                    LocalStoreManager.setProducts(capList);
                    callback(capList);
                    return;
                  }
                }
              } catch {
                // ignore
              }

              // Deliver local authentic products immediately so laptop never renders blank!
              const initial = LocalStoreManager.getProducts();
              callback(initial);

              // Auto-seed Firestore from local catalog if cloud database is empty
              try {
                for (const prod of initial) {
                  await setDoc(doc(db, 'products', prod.id), {
                    ...prod,
                    created_at: prod.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }, { merge: true });
                }
              } catch (seedErr) {
                console.warn('Auto-seed products skipped (requires admin permissions):', seedErr);
              }
              return;
            }

            const list: Product[] = [];
            snapshot.forEach((d) => {
              if (!UNWANTED_PRODUCT_IDS.has(d.id)) {
                list.push(normalizeProductDocument(d.id, d.data()));
              }
            });

            // If all documents in Firestore were legacy dummy products and list is empty
            if (list.length === 0) {
              const initial = LocalStoreManager.getProducts();
              callback(initial);
              return;
            }

            // In-memory sort: featured first, then by name (no Firestore index required)
            list.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return (a.name || '').localeCompare(b.name || '');
            });

            LocalStoreManager.setProducts(list);
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
        let snap = await getDocs(collection(db, 'products'));
        if (snap.empty) {
          snap = await getDocs(collection(db, 'Products'));
        }

        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach(d => {
            if (!UNWANTED_PRODUCT_IDS.has(d.id)) {
              list.push(normalizeProductDocument(d.id, d.data()));
            }
          });
          if (list.length > 0) {
            list.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return (a.name || '').localeCompare(b.name || '');
            });
            return list;
          }
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
        let docRef = doc(db, 'products', id);
        let snap = await getDoc(docRef);
        if (!snap.exists()) {
          docRef = doc(db, 'Products', id);
          snap = await getDoc(docRef);
        }
        if (snap.exists()) {
          return normalizeProductDocument(snap.id, snap.data());
        }
      } catch (err) {
        console.error('Firestore getProductById error:', err);
      }
    }
    return LocalStoreManager.getProductById(id) || null;
  },

  async saveProduct(product: Partial<Product> & { name: string; brand: string; price?: number }): Promise<Product> {
    const prodId = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const rawPayload: any = {
      name: (product.name || 'Radhe Krishna Cattle Feed').trim(),
      brand: (product.brand || 'Radhe Krishna (Krishna Agrovet)').trim(),
      sku: product.sku || `KAV-${Date.now().toString().slice(-6)}`,
      category_id: product.category_id || 'cat-1',
      bag_weight_kg: Number(product.bag_weight_kg) || 50,
      price: Number(product.price || 0),
      available_stock: Number(product.available_stock !== undefined ? product.available_stock : 50),
      low_stock_threshold: Number(product.low_stock_threshold !== undefined ? product.low_stock_threshold : 10),
      description: product.description || '',
      short_description: product.short_description || '',
      image_url: product.image_url || '/images/products/radhe-krishna-bypass-50kg.svg',
      is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
      featured: Boolean(product.featured),
      nutritional_info: product.nutritional_info || {},
      feeding_guide: product.feeding_guide || '',
      features: Array.isArray(product.features) ? product.features : [],
      ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
      updated_at: new Date().toISOString(),
    };

    if (product.mrp !== undefined && product.mrp !== null && !isNaN(Number(product.mrp))) {
      rawPayload.mrp = Number(product.mrp);
    }
    if (product.packaging_info) {
      rawPayload.packaging_info = product.packaging_info;
    }
    if (!product.id) {
      rawPayload.created_at = new Date().toISOString();
    }

    const payload = sanitizeFirestorePayload(rawPayload);

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'products', prodId);
        await setDoc(docRef, payload, { merge: true });
      } catch (cloudErr) {
        console.error('Failed to write product to Firestore, saving locally:', cloudErr);
      }
    }

    const saved = LocalStoreManager.saveProduct({ ...payload, id: prodId });
    return saved;
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
    // Deliver locally cached categories synchronously at 0ms
    try {
      const cached = LocalStoreManager.getCategories();
      if (cached && cached.length > 0) {
        callback(cached);
      }
    } catch (err) {
      console.warn('Error retrieving cached categories:', err);
    }

    if (isFirebaseConfigured() && db) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, 'categories'),
          async (snapshot) => {
            if (snapshot.empty) {
              const initial = LocalStoreManager.getCategories();
              callback(initial);
              try {
                for (const cat of initial) {
                  await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
                }
              } catch (seedErr) {
                console.warn('Auto-seed categories skipped:', seedErr);
              }
              return;
            }

            const list: Category[] = [];
            snapshot.forEach((d) => {
              list.push({ id: d.id, ...d.data() } as Category);
            });
            list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            LocalStoreManager.setCategories(list);
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
        let snap = await getDocs(collection(db, 'categories'));
        if (snap.empty) {
          snap = await getDocs(collection(db, 'Categories'));
        }
        if (!snap.empty) {
          const list: Category[] = [];
          snap.forEach(d => {
            list.push({ id: d.id, ...d.data() } as Category);
          });
          list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
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
    // Deliver locally cached settings synchronously at 0ms
    try {
      const cached = LocalStoreManager.getSettings();
      if (cached) {
        callback(cached);
      }
    } catch (err) {
      console.warn('Error retrieving cached settings:', err);
    }

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'store_settings', 'default');
        const unsubscribe = onSnapshot(
          docRef,
          async (snapshot) => {
            if (!snapshot.exists()) {
              const initial = LocalStoreManager.getSettings();
              callback(initial);
              try {
                await setDoc(docRef, initial, { merge: true });
              } catch (seedErr) {
                console.warn('Auto-seed settings skipped:', seedErr);
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
    const current = await this.getSettings();
    const updated = sanitizeFirestorePayload({ ...current, ...settings, updated_at: new Date().toISOString() });
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'store_settings', 'default');
        await setDoc(docRef, updated, { merge: true });
      } catch (err) {
        console.error('Failed to update store settings in Firestore:', err);
      }
    }
    LocalStoreManager.updateSettings(settings);
    return updated;
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
        let pRef = doc(db, 'products', productId);
        let pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) {
          pRef = doc(db, 'Products', productId);
          pSnap = await transaction.get(pRef);
        }
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

  // ORDERS - REAL-TIME SUBSCRIPTION
  subscribeOrders(callback: (orders: Order[]) => void, onError?: (err: any) => void): Unsubscribe {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100));
        return onSnapshot(
          q,
          (snap) => {
            const list: Order[] = [];
            snap.forEach(d => {
              list.push({ id: d.id, ...d.data() } as Order);
            });
            callback(list);
          },
          (err) => {
            console.error('Firestore orders onSnapshot error:', err);
            onError?.(err);
            callback(LocalStoreManager.getOrders());
          }
        );
      } catch (err) {
        console.error('Error subscribing to orders:', err);
        onError?.(err);
      }
    }

    callback(LocalStoreManager.getOrders());
    const handler = () => {
      callback(LocalStoreManager.getOrders());
    };
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  },

  // ORDERS - PLACE ATOMIC ORDER
  async placeOrderAtomic(
    customerData: CheckoutCustomerData,
    items: { product_id: string; quantity: number }[],
    idempotencyKey?: string
  ): Promise<AtomicOrderResult> {
    if (isFirebaseConfigured() && db) {
      try {
        let productsSnap = await getDocs(collection(db, 'products'));
        if (productsSnap.empty) {
          productsSnap = await getDocs(collection(db, 'Products'));
        }

        const products: Product[] = [];
        productsSnap.forEach(d => {
          if (!UNWANTED_PRODUCT_IDS.has(d.id)) {
            products.push(normalizeProductDocument(d.id, d.data()));
          }
        });

        // If products in Firestore are empty, fall back to local catalog
        if (products.length === 0) {
          products.push(...LocalStoreManager.getProducts());
        }

        const settingsSnap = await getDoc(doc(db, 'store_settings', 'default'));
        const settings: StoreSettings = settingsSnap.exists()
          ? (settingsSnap.data() as StoreSettings)
          : LocalStoreManager.getSettings();

        // Idempotency check
        if (idempotencyKey) {
          try {
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
          } catch (idempErr) {
            console.warn('Idempotency query error:', idempErr);
          }
        }

        if (!items || items.length === 0) {
          throw new Error('Order items cannot be empty.');
        }

        let totalBags = 0;
        let subtotalAmount = 0;
        const newOrderId = `ord-${Date.now()}`;
        const newOrderNumber = generateMockOrderNumber();
        const orderItems: OrderItem[] = [];

        for (const item of items) {
          const prod = products.find(p => p.id === item.product_id) || LocalStoreManager.getProductById(item.product_id);
          if (!prod) throw new Error(`Product not found: ${item.product_id}`);
          if (prod.is_active === false) throw new Error(`Product "${prod.name}" is discontinued.`);
          if (prod.available_stock < item.quantity) {
            throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.available_stock} bags, Requested: ${item.quantity} bags.`);
          }
          totalBags += item.quantity;
          const lineTotal = prod.price * item.quantity;
          subtotalAmount += lineTotal;
          orderItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            order_id: newOrderId,
            product_id: prod.id,
            product_name: prod.name,
            brand: prod.brand || 'Radhe Krishna (Krishna Agrovet)',
            bag_weight_kg: prod.bag_weight_kg || 50,
            unit_price: prod.price,
            quantity: item.quantity,
            line_total: lineTotal,
            created_at: new Date().toISOString(),
          });
        }

        const deliveryFee = totalBags < settings.free_delivery_threshold_bags
          ? totalBags * settings.delivery_fee_per_bag
          : 0;
        const totalAmount = subtotalAmount + deliveryFee;

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

        // 1. Save Order document into Firestore
        await setDoc(doc(db, 'orders', newOrderId), newOrder);

        // 2. Adjust product stock & inventory movements in Firestore (best effort)
        for (const item of items) {
          const prod = products.find(p => p.id === item.product_id)!;
          const newStock = Math.max(0, prod.available_stock - item.quantity);
          try {
            await updateDoc(doc(db, 'products', prod.id), {
              available_stock: newStock,
              updated_at: new Date().toISOString(),
            });
          } catch (stkErr) {
            console.warn('Could not update product stock in Firestore:', stkErr);
          }

          try {
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
          } catch (movErr) {
            console.warn('Could not record inventory movement in Firestore:', movErr);
          }
        }

        // Also record in local store so local offline cache is in sync
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
          message: 'Order created and saved successfully in Firestore.',
        };
      } catch (err: any) {
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
        message: 'Firebase configuration is incomplete. Please check VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.',
        projectId: null,
      };
    }

    const cfg = getFirebaseConfig();

    try {
      // 1. Test ping write/read
      const pingDoc = doc(db, '_connection_test', 'status');
      await setDoc(pingDoc, {
        timestamp: new Date().toISOString(),
        client: 'Krishna Agrovet Web App',
      }, { merge: true });

      const snap = await getDoc(pingDoc);
      if (snap.exists()) {
        return {
          success: true,
          message: `Successfully connected to Cloud Firestore (Project: ${cfg.projectId})! Real-time streaming and data operations active.`,
          projectId: cfg.projectId,
        };
      }
      throw new Error('Test document was written but could not be read back.');
    } catch (err: any) {
      // If ping write failed due to security rules, test read-only on store_settings or products
      try {
        await getDoc(doc(db, 'store_settings', 'default'));
        return {
          success: true,
          message: `Connected to Cloud Firestore (Project: ${cfg.projectId}) in Read mode.`,
          projectId: cfg.projectId,
        };
      } catch (readErr: any) {
        return {
          success: false,
          message: `Firestore connection error: ${err.message || 'Check project ID, API key, and security rules.'}`,
          projectId: cfg.projectId || null,
        };
      }
    }
  }
};
