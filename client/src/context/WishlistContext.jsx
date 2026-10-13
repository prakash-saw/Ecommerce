import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const GUEST_WISHLIST_KEY = 'blanc_guest_wishlist';

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/wishlist');
      if (res.success) {
        setWishlist(res.products || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // On auth state change, merge guest wishlist if user just authenticated
  useEffect(() => {
    const handleAuthSync = async () => {
      if (user) {
        const guestSavedStr = localStorage.getItem(GUEST_WISHLIST_KEY);
        if (guestSavedStr) {
          try {
            const guestIds = JSON.parse(guestSavedStr);
            if (Array.isArray(guestIds) && guestIds.length > 0) {
              const res = await apiRequest('/wishlist/merge', {
                method: 'POST',
                body: JSON.stringify({ guestProductIds: guestIds })
              });
              if (res.success) {
                setWishlist(res.products || []);
                localStorage.removeItem(GUEST_WISHLIST_KEY);
                return;
              }
            }
          } catch (mergeErr) {
            console.warn('Guest wishlist merge error:', mergeErr.message);
          }
        }
      }
      fetchWishlist();
    };

    handleAuthSync();
  }, [user]);

  // Persist guest additions to localStorage if unauthenticated
  const persistGuestIds = (products) => {
    if (!user) {
      const ids = products.map(p => (p._id || p));
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
    }
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    const idStr = typeof productId === 'object' ? productId._id : productId;
    return wishlist.some(item => (item._id || item) === idStr);
  };

  const toggleWishlist = async (product) => {
    if (!product) return false;
    const prodId = product._id || product;

    // Optimistic local state update
    const alreadyIn = isInWishlist(prodId);
    let updated;
    if (alreadyIn) {
      updated = wishlist.filter(item => (item._id || item) !== prodId);
    } else {
      updated = [...wishlist, product];
    }
    setWishlist(updated);
    persistGuestIds(updated);

    try {
      const res = await apiRequest('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId: prodId })
      });
      if (res.success) {
        setWishlist(res.products || []);
        persistGuestIds(res.products || []);
      }
      return !alreadyIn;
    } catch (err) {
      console.error('Wishlist toggle error:', err.message);
      fetchWishlist();
      return alreadyIn;
    }
  };

  const removeFromWishlist = async (productId) => {
    const prodId = productId._id || productId;
    const updated = wishlist.filter(item => (item._id || item) !== prodId);
    setWishlist(updated);
    persistGuestIds(updated);

    try {
      const res = await apiRequest(`/wishlist/${prodId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setWishlist(res.products || []);
        persistGuestIds(res.products || []);
      }
    } catch (err) {
      fetchWishlist();
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        fetchWishlist,
        loading
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
