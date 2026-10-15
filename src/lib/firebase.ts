import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, 
  updateDoc, deleteDoc, query, where, orderBy, limit, runTransaction 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  Product, Category, Order, StoreSettings, InventoryMovement, 
  CheckoutCustomerData, AtomicOrderResult, OrderStatus, InventoryMovementReason 
} from '../types';
import { LocalStoreManager, generateMockOrderNumber } from './mockStore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return (
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.trim().length > 0 &&
    typeof firebaseConfig.projectId === 'string' &&
    firebaseConfig.projectId.trim().length > 0 &&
    !firebaseConfig.projectId.includes('your-project-id')
  );
};

// Initialize Firebase App
export const app = isFirebaseConfigured()
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

// ==============================================================================
// UNIFIED DATA SERVICE (Cloud Firestore + Reactive Local Fallback)
// ==============================================================================

export const dataService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'products'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        const list: Product[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Product);
        });
        return list;
      } catch (err) {
        console.error('Firestore getProducts error:', err);
        throw err;
      }
    }
    return LocalStoreManager.getProducts();
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Product;
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
        updated_at: new Date().toISOString(),
      };

      if (!product.id) {
        payload.created_at = new Date().toISOString();
      }

      await setDoc(docRef, payload, { merge: true });
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
      return { ...prod, is_active: newActive };
    }
    return LocalStoreManager.toggleProductActive(id);
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'products', id);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        console.error('Firestore deleteProduct error:', err);
        throw err;
      }
    }
    return LocalStoreManager.deleteProduct(id);
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'categories'), orderBy('display_order', 'asc'));
        const snap = await getDocs(q);
        const list: Category[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Category);
        });
        return list;
      } catch (err) {
        console.error('Firestore getCategories error:', err);
      }
    }
    return LocalStoreManager.getCategories();
  },

  // STORE SETTINGS
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
      return updated;
    }
    return LocalStoreManager.updateSettings(settings);
  },

  // ORDERS & ATOMIC CONCURRENCY-SAFE TRANSACTION
  async placeOrderAtomic(
    customerData: CheckoutCustomerData,
    items: { product_id: string; quantity: number }[],
    idempotencyKey?: string
  ): Promise<AtomicOrderResult> {
    if (isFirebaseConfigured() && db) {
      try {
        return await runTransaction(db, async (transaction) => {
          // 1. Idempotency Check
          if (idempotencyKey) {
            const q = query(collection(db, 'orders'), where('idempotency_key', '==', idempotencyKey), limit(1));
            const existingSnap = await getDocs(q);
            if (!existingSnap.empty) {
              const existing = existingSnap.docs[0].data() as Order;
              return {
                success: true,
                order_id: existingSnap.docs[0].id,
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

          // 2. Fetch Store Settings for Delivery thresholds
          const settingsRef = doc(db, 'store_settings', 'default');
          const settingsSnap = await transaction.get(settingsRef);
          const settingsData: StoreSettings = settingsSnap.exists() 
            ? (settingsSnap.data() as StoreSettings)
            : LocalStoreManager.getSettings();

          // 3. Read and lock all product documents inside the transaction
          const productDocs: { ref: any; data: Product; requestedQty: number }[] = [];
          let subtotal = 0;
          let totalBags = 0;

          for (const item of items) {
            const pRef = doc(db, 'products', item.product_id);
            const pSnap = await transaction.get(pRef);

            if (!pSnap.exists()) {
              throw new Error(`Feed product ID "${item.product_id}" does not exist.`);
            }

            const pData = { id: pSnap.id, ...pSnap.data() } as Product;

            if (!pData.is_active) {
              throw new Error(`Product "${pData.name}" is currently inactive.`);
            }

            if (pData.available_stock < item.quantity) {
              throw new Error(
                `Insufficient stock for "${pData.name}". Available: ${pData.available_stock} bags, Requested: ${item.quantity} bags.`
              );
            }

            subtotal += pData.price * item.quantity;
            totalBags += item.quantity;
            productDocs.push({ ref: pRef, data: pData, requestedQty: item.quantity });
          }

          // 4. Calculate Delivery Fee
          const threshold = settingsData.free_delivery_threshold_bags || 5;
          const feePerBag = settingsData.delivery_fee_per_bag || 30;
          const deliveryFee = totalBags >= threshold ? 0 : totalBags * feePerBag;
          const totalAmount = subtotal + deliveryFee;

          // 5. Generate unique order number
          const orderNumber = generateMockOrderNumber();
          const newOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const orderRef = doc(db, 'orders', newOrderId);

          // 6. Deduct stock and prepare immutable items snapshot
          const orderItems = productDocs.map(({ ref, data, requestedQty }) => {
            const newStock = data.available_stock - requestedQty;
            transaction.update(ref, {
              available_stock: newStock,
              updated_at: new Date().toISOString(),
            });

            // Write movement audit doc
            const movRef = doc(collection(db, 'inventory_movements'));
            transaction.set(movRef, {
              product_id: data.id,
              product_name: data.name,
              change_quantity: -requestedQty,
              previous_stock: data.available_stock,
              new_stock: newStock,
              reason: 'order_placed',
              order_id: newOrderId,
              notes: `Customer order ${orderNumber}`,
              created_at: new Date().toISOString(),
            });

            return {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              order_id: newOrderId,
              product_id: data.id,
              product_name: data.name,
              brand: data.brand,
              bag_weight_kg: data.bag_weight_kg,
              unit_price: data.price,
              quantity: requestedQty,
              line_total: data.price * requestedQty,
            };
          });

          // 7. Write Order Document
          const orderDocPayload: Order = {
            id: newOrderId,
            order_number: orderNumber,
            customer_name: customerData.customer_name.trim(),
            customer_phone: customerData.customer_phone.trim(),
            village_town: customerData.village_town.trim(),
            full_address: customerData.full_address.trim(),
            landmark: customerData.landmark?.trim() || '',
            pincode: customerData.pincode.trim(),
            district: customerData.district || 'Alwar',
            state: customerData.state || 'Rajasthan',
            delivery_notes: customerData.delivery_notes?.trim() || '',
            landmark_photo_url: customerData.landmark_photo_url || '',
            total_bags: totalBags,
            subtotal_amount: subtotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount,
            payment_method: customerData.payment_method || 'cash_on_delivery',
            status: 'pending',
            idempotency_key: idempotencyKey || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: orderItems,
          };

          transaction.set(orderRef, orderDocPayload);

          return {
            success: true,
            order_id: newOrderId,
            order_number: orderNumber,
            total_bags: totalBags,
            subtotal_amount: subtotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount,
            status: 'pending',
            message: 'Order created atomically in Firestore and stock deducted.',
          };
        });
      } catch (err: any) {
        console.error('Firestore placeOrderAtomic error:', err);
        throw new Error(err.message || 'Failed to place order in Firestore.');
      }
    }

    return LocalStoreManager.placeOrderAtomic(customerData, items, idempotencyKey);
  },

  async getOrders(): Promise<Order[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
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

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, 'orders'),
          where('order_number', '==', orderNumber.trim().toUpperCase()),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: d.id, ...d.data() } as Order;
        }
      } catch (err) {
        console.error('Firestore getOrderByNumber error:', err);
      }
      return null;
    }
    return LocalStoreManager.getOrderByNumber(orderNumber) || null;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, 'orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Order;
    }
    return LocalStoreManager.getOrderById(orderId) || null;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    if (isFirebaseConfigured() && db) {
      if (status === 'cancelled') {
        // Atomic cancellation with stock restore
        return await runTransaction(db, async (transaction) => {
          const oRef = doc(db, 'orders', orderId);
          const oSnap = await transaction.get(oRef);
          if (!oSnap.exists()) throw new Error('Order not found');

          const orderData = oSnap.data() as Order;
          if (orderData.status === 'cancelled') {
            return orderData; // Already cancelled
          }

          // Restore stock for each item
          if (orderData.items && orderData.items.length > 0) {
            for (const item of orderData.items) {
              if (!item.product_id) continue;
              const pRef = doc(db, 'products', item.product_id);
              const pSnap = await transaction.get(pRef);
              if (pSnap.exists()) {
                const currentStock = pSnap.data().available_stock || 0;
                const restoredStock = currentStock + item.quantity;
                transaction.update(pRef, {
                  available_stock: restoredStock,
                  updated_at: new Date().toISOString(),
                });

                const movRef = doc(collection(db, 'inventory_movements'));
                transaction.set(movRef, {
                  product_id: item.product_id,
                  product_name: item.product_name,
                  change_quantity: item.quantity,
                  previous_stock: currentStock,
                  new_stock: restoredStock,
                  reason: 'order_cancelled',
                  order_id: orderId,
                  notes: `Restored stock on cancellation: ${notes || 'Admin cancelled'}`,
                  created_at: new Date().toISOString(),
                });
              }
            }
          }

          const updatedNotes = `${orderData.internal_notes ? orderData.internal_notes + '\n' : ''}[Cancelled ${new Date().toLocaleDateString('en-IN')}] ${notes || 'Status updated to cancelled'}`;
          transaction.update(oRef, {
            status: 'cancelled',
            internal_notes: updatedNotes,
            updated_at: new Date().toISOString(),
          });

          return {
            ...orderData,
            status: 'cancelled',
            internal_notes: updatedNotes,
            updated_at: new Date().toISOString(),
          };
        });
      } else {
        const oRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(oRef);
        if (!orderSnap.exists()) throw new Error('Order not found');
        const orderData = orderSnap.data() as Order;

        const updatedNotes = notes
          ? `${orderData.internal_notes ? orderData.internal_notes + '\n' : ''}[${new Date().toLocaleDateString('en-IN')}] ${notes}`
          : orderData.internal_notes;

        await updateDoc(oRef, {
          status,
          internal_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        });

        return {
          ...orderData,
          status,
          internal_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        };
      }
    }

    return LocalStoreManager.updateOrderStatus(orderId, status, notes);
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
        if (!pSnap.exists()) throw new Error('Product not found');

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

        return { id: pSnap.id, ...pSnap.data(), available_stock: newStock } as Product;
      });
    }

    return LocalStoreManager.adjustInventory(productId, changeQuantity, reason, notes);
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
};
