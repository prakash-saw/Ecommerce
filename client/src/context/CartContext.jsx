import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/cart');
      if (res.success) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error('Failed to load cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (itemPayload) => {
    try {
      setLoading(true);
      const res = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify(itemPayload)
      });
      if (res.success) {
        setCart(res.cart);
        setIsCartOpen(true);
      }
      return res;
    } catch (err) {
      alert(err.message || 'Error adding to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await apiRequest('/cart/update-quantity', {
        method: 'PUT',
        body: JSON.stringify({ itemId, quantity })
      });
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Quantity update failed:', err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await apiRequest(`/cart/item/${itemId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Remove item failed:', err.message);
    }
  };

  const applyCoupon = async (couponCode) => {
    const res = await apiRequest('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode })
    });
    if (res.success) {
      await fetchCart();
    }
    return res;
  };

  const items = cart?.items || [];
  const itemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemsCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        fetchCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
