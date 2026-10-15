import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useStoreSettings } from './StoreSettingsContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message: string };
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalBags: number;
  totalWeightKg: number;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  isFreeDelivery: boolean;
  bagsForFreeDelivery: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'kav_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStoreSettings();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [items]);

  const addItem = (product: Product, quantity: number = 1): { success: boolean; message: string } => {
    if (quantity <= 0) return { success: false, message: 'Quantity must be at least 1' };
    if (product.available_stock <= 0) {
      return { success: false, message: `"${product.name}" is currently out of stock.` };
    }

    const existingIndex = items.findIndex(item => item.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const requestedTotalQty = currentQtyInCart + quantity;

    if (requestedTotalQty > product.available_stock) {
      return {
        success: false,
        message: `Only ${product.available_stock} bags available in stock. You already have ${currentQtyInCart} in your cart.`,
      };
    }

    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity = requestedTotalQty;
      setItems(newItems);
    } else {
      setItems([...items, { product, quantity }]);
    }

    return {
      success: true,
      message: `Added ${quantity} bag(s) of ${product.name} to your cart.`,
    };
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message: string } => {
    const itemIndex = items.findIndex(item => item.product.id === productId);
    if (itemIndex === -1) return { success: false, message: 'Item not found in cart' };

    if (quantity <= 0) {
      removeItem(productId);
      return { success: true, message: 'Item removed from cart' };
    }

    const product = items[itemIndex].product;
    if (quantity > product.available_stock) {
      return {
        success: false,
        message: `Cannot exceed available stock of ${product.available_stock} bags.`,
      };
    }

    const newItems = [...items];
    newItems[itemIndex].quantity = quantity;
    setItems(newItems);
    return { success: true, message: 'Quantity updated' };
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculations
  const totalBags = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = items.reduce(
    (sum, item) => sum + (item.product.bag_weight_kg || 50) * item.quantity,
    0
  );
  const subtotalAmount = items.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );

  const threshold = settings.free_delivery_threshold_bags || 5;
  const isFreeDelivery = totalBags >= threshold || totalBags === 0;
  const bagsForFreeDelivery = Math.max(0, threshold - totalBags);
  const deliveryFee = isFreeDelivery ? 0 : totalBags * (settings.delivery_fee_per_bag || 30);
  const totalAmount = subtotalAmount + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalBags,
        totalWeightKg,
        subtotalAmount,
        deliveryFee,
        totalAmount,
        isFreeDelivery,
        bagsForFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
